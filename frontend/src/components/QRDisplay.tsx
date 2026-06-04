import { clsx } from 'clsx'

interface QRDisplayProps {
  base64: string
  batchNumber: string
  className?: string
}

export const QRDisplay = ({ base64, batchNumber, className = '' }: QRDisplayProps) => {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${base64}`
    link.download = `batch-${batchNumber}-qrcode.png`
    link.click()
  }

  const handlePrint = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code for Batch ${batchNumber}</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              img { max-width: 80%; height: auto; }
            </style>
          </head>
          <body>
            <img src="data:image/png;base64,${base64}" alt="QR Code for Batch ${batchNumber}" />
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <div className={clsx('bg-[var(--bg1)]/50 backdrop-blur-sm rounded-xl border border-[var(--border)]/20 p-6 text-center', className)}>
      <h3 className="text-[var(--t1)] font-semibold mb-4">
        Batch ${batchNumber} QR Code
      </h3>
      
      <div className="relative inline-block mb-6">
        <img 
          src={`data:image/png;base64,${base64}`} 
          alt={`QR Code for Batch ${batchNumber}`} 
          className="w-48 h-48 rounded border border-[var(--border)]/20"
        />
        {/* Optional: Add a subtle scan effect overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-scan-line absolute inset-0 bg-[var(--cyan)]/10" />
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button 
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2 bg-[var(--blue)]/20 text-[var(--blue)] rounded hover:bg-[var(--blue)]/30 transition-colors"
        >
          <i className="ti ti-download" aria-hidden="true" />
          <span>Download</span>
        </button>
        
        <button 
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 bg-[var(--green)]/20 text-[var(--green)] rounded hover:bg-[var(--green)]/30 transition-colors"
        >
          <i className="ti ti-printer" aria-hidden="true" />
          <span>Print</span>
        </button>
      </div>
      
      <p className="mt-4 text-[var(--t2)] text-sm">
        Scan this QR code to verify the provenance of batch ${batchNumber}
      </p>
    </div>
  )
}