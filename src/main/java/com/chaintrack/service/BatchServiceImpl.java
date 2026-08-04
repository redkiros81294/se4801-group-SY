package com.chaintrack.service;

import com.chaintrack.dto.request.CreateBatchRequest;
import com.chaintrack.dto.response.GenerateBatchTokenResponse;
import com.chaintrack.exception.ResourceNotFoundException;
import com.chaintrack.exception.AccessDeniedException;
import com.chaintrack.model.*;
import com.chaintrack.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import static org.apache.commons.lang3.StringUtils.isBlank;

@Service
@Transactional(readOnly = true)
public class BatchServiceImpl implements BatchService {

    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;
    private final OrganizationRepository organizationRepository;
    private final QRTokenRepository qrTokenRepository;
    private final QRCodeService qrCodeService;

    public BatchServiceImpl(BatchRepository batchRepository,
                           ProductRepository productRepository,
                           OrganizationRepository organizationRepository,
                           QRTokenRepository qrTokenRepository,
                           QRCodeService qrCodeService) {
        this.batchRepository = batchRepository;
        this.productRepository = productRepository;
        this.organizationRepository = organizationRepository;
        this.qrTokenRepository = qrTokenRepository;
        this.qrCodeService = qrCodeService;
    }

    @Override
    @Transactional
    public Batch createBatch(CreateBatchRequest request) {
        Product product = productRepository.findById(java.util.UUID.fromString(request.productId()))
            .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.productId()));

        Organization manufacturer = organizationRepository.findById(java.util.UUID.fromString(request.manufacturerId()))
            .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", request.manufacturerId()));

        // Verify the manufacturer owns the product
        if (product.getManufacturer() == null ||
            !product.getManufacturer().getId().equals(manufacturer.getId())) {
            throw new AccessDeniedException(
                "Organization '" + manufacturer.getId() + "' does not own product '" + request.productId() + "'");
        }

        // Generate batch number: {SKU}-{yyyyMMdd}-{UUID8}
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String uuid8 = UUID.randomUUID().toString().substring(0, 8);
        String batchNumber = product.getSku() + "-" + date + "-" + uuid8;

        Batch batch = Batch.builder()
            .batchNumber(batchNumber)
            .product(product)
            .status(BatchStatus.CREATED)
            .manufacturer(manufacturer)
            .build();

        return batchRepository.save(batch);
    }

    @Override
    public Batch getBatchById(String batchId) {
        if (isBlank(batchId)) {
            throw new IllegalArgumentException("Batch id must not be blank");
        }
        return batchRepository.findById(java.util.UUID.fromString(batchId))
            .orElseThrow(() -> new ResourceNotFoundException("Batch", "id", batchId));
    }

    @Override
    public Page<Batch> listBatches(Pageable pageable) {
        return batchRepository.findAll(pageable);
    }

    /**
     * Paginated list of batches owned by a single organization.
     * Used to scope batch visibility to the caller's own org (BOLA protection).
     */
    @Override
    public Page<Batch> listBatchesForOrg(String orgId, Pageable pageable) {
        if (isBlank(orgId)) {
            throw new IllegalArgumentException("Organization id must not be blank");
        }
        Organization org = organizationRepository.findById(UUID.fromString(orgId))
            .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", orgId));
        return batchRepository.findByManufacturer(org, pageable);
    }

    @Override
    @Transactional
    public Batch advanceStatus(String batchId, BatchStatus nextStatus, String actorOrgId) {
        if (isBlank(batchId)) {
            throw new IllegalArgumentException("Batch id must not be blank");
        }
        if (isBlank(actorOrgId)) {
            throw new IllegalArgumentException("Actor org id must not be blank");
        }

        Batch batch = batchRepository.findById(java.util.UUID.fromString(batchId))
            .orElseThrow(() -> new ResourceNotFoundException("Batch", "id", batchId));

        // BOLA check: only the owning org may change status
        if (batch.getManufacturer() == null ||
            !batch.getManufacturer().getId().toString().equals(actorOrgId)) {
            throw new AccessDeniedException(
                "Organization '" + actorOrgId + "' does not own batch '" + batchId + "'");
        }

        batch.setStatus(nextStatus);
        return batchRepository.save(batch);
    }

    /**
     * Generates a QR token for a batch. Creates a UUID token and QR code image.
     * <p>
     * Only the MANUFACTURER organization that owns the batch may mint a QR
     * (BOLA check), and a batch has at most one QR token: a second call returns
     * the existing token instead of hitting the DB unique constraint.
     *
     * @param batchId    the batch id
     * @param actorOrgId the authenticated caller's organization id
     * @return GenerateBatchTokenResponse with token and QR image
     */
    @Transactional
    public GenerateBatchTokenResponse generateQR(String batchId, String actorOrgId) {
        if (isBlank(actorOrgId)) {
            throw new IllegalArgumentException("Actor org id must not be blank");
        }

        Batch batch = getBatchById(batchId);

        // BOLA check: only the owning manufacturer org may mint a QR for this batch
        if (batch.getManufacturer() == null ||
            !batch.getManufacturer().getId().toString().equals(actorOrgId)) {
            throw new AccessDeniedException(
                "Organization '" + actorOrgId + "' does not own batch '" + batchId + "'");
        }

        // Idempotent: a batch has exactly one QR token
        var existing = qrTokenRepository.findByBatch(batch);
        if (existing.isPresent()) {
            QRToken qrToken = existing.get();
            return new GenerateBatchTokenResponse(
                batch.getId().toString(),
                qrToken.getTokenValue(),
                qrToken.getQrImage(),
                qrToken.getCreatedAt()
            );
        }

        UUID tokenValue = UUID.randomUUID();
        String qrContent = tokenValue.toString();
        String qrImage = qrCodeService.generateQRCode(qrContent);

        QRToken qrToken = QRToken.builder()
            .tokenValue(tokenValue)
            .qrImage(qrImage)
            .batch(batch)
            .build();

        QRToken saved = qrTokenRepository.save(qrToken);

        return new GenerateBatchTokenResponse(
            batch.getId().toString(),
            saved.getTokenValue(),
            saved.getQrImage(),
            saved.getCreatedAt()
        );
    }
}
