package com.chaintrack.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request model for the route POST /products/{productId} (ProductForm).
 * Hard-validates the fields the form posts before they reach the service.
 */
public record UpdateProductRequest(
    String productId,

    @NotBlank @Size(max = 255)
    String name,

    @Size(max = 255)
    String category,

    @Size(max = 1000)
    String description,

    @NotNull @Digits(integer = 10, fraction = 2, message = "flat-Rate must be a number")
    Object flatRate, // BigDecimal/flatRate

    @NotNull
    Object productImage, // MultipartFile binary blob (form input)

    @Size(max = 50)
    String sku
) {}
