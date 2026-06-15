import { useState, useRef } from "react";
import {
  X,
  Download,
  FileText,
  User,
  Phone,
  IndianRupee,
  Package,
  CheckCircle,
  Printer,
} from "lucide-react";
import { colors } from "../theme/colors";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  loanObjectId: string;
  type: "success" | "view";
  invoiceData?: {
    customerName: string;
    customerPhone: string;
    loanAmount: number;
    totalAmount?: number;
    repaymentDate?: string;
    payment?: {
      cash: number;
      online: number;
    };
    items: Array<{
      name: string;
      category: string;
      weight: number;
      estimatedValue: number;
    }>;
  };
}

export const InvoiceModal = ({
  isOpen,
  onClose,
  loanId,
  loanObjectId,
  type,
  invoiceData,
}: InvoiceModalProps) => {
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalPaid =
    (invoiceData?.payment?.cash || 0) + (invoiceData?.payment?.online || 0);
  const balance = (invoiceData?.loanAmount || 0) - totalPaid;
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const generatePDF = async (action: "download" | "print") => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
      if (action === "download") {
        pdf.save(`Invoice-${loanId}.pdf`);
      } else {
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank");
        if (win) {
          win.onload = () => { win.print(); URL.revokeObjectURL(url); };
        }
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: colors.primary[100] }}>
              {type === "success" ? (
                <CheckCircle className="h-6 w-6" style={{ color: colors.primary.dark }} />
              ) : (
                <FileText className="h-6 w-6" style={{ color: colors.primary.dark }} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {type === "success" ? "Payment Successful!" : "🎉 Billing Created Successfully!"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loan ID: <span className="font-bold text-blue-600">{loanId}</span> | Invoice ready
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pt-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => generatePDF("print")}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Print Invoice
            </button>
            <button
              onClick={() => generatePDF("download")}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </button>
          </div>
        </div>

        {/* Printable Invoice Preview */}
        <div className="px-6 pb-6">
          <div
            ref={invoiceRef}
            style={{
              background: "#fff",
              fontFamily: "Arial, sans-serif",
              fontSize: 13,
              color: "#111",
              padding: "32px 28px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Invoice Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16, borderBottom: "2px solid #111", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>Pawn Billing</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Secure · Reliable · Efficient</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#B8860B", letterSpacing: 2 }}>INVOICE</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>#{loanId}</div>
                <div style={{ fontSize: 11, color: "#555" }}>{today}</div>
              </div>
            </div>

            {/* Customer + Loan */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 8 }}>Customer Details</div>
                {[["Name", invoiceData?.customerName || "—"], ["Phone", invoiceData?.customerPhone || "—"]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", gap: 6, marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: "#666", minWidth: 50 }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 8 }}>Loan Details</div>
                {[
                  ["Loan ID", loanId],
                  ["Amount", `₹${invoiceData?.loanAmount?.toLocaleString("en-IN") || 0}`],
                  ["Cash Paid", `₹${(invoiceData?.payment?.cash || 0).toLocaleString("en-IN")}`],
                  ["Online Paid", `₹${(invoiceData?.payment?.online || 0).toLocaleString("en-IN")}`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", gap: 6, marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: "#666", minWidth: 75 }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 8 }}>Pledged Items</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#111" }}>
                    {["#", "Item", "Category", "Weight", "Est. Value"].map((h) => (
                      <th key={h} style={{ padding: "7px 10px", fontSize: 11, textAlign: "left", color: "#fff" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoiceData?.items?.map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "7px 10px", fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12, fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12 }}>{item.category}</td>
                      <td style={{ padding: "7px 10px", fontSize: 12 }}>{item.weight}g</td>
                      <td style={{ padding: "7px 10px", fontSize: 12, fontWeight: 600 }}>₹{Number(item.estimatedValue).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ borderTop: "2px solid #111", paddingTop: 12, marginBottom: 24 }}>
              {[["Loan Amount", `₹${invoiceData?.loanAmount?.toLocaleString("en-IN") || 0}`], ["Total Paid", `₹${totalPaid.toLocaleString("en-IN")}`]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13 }}>
                  <span style={{ color: "#555" }}>{l}</span><span>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontSize: 15, fontWeight: 800, borderTop: "1px solid #ddd", marginTop: 4 }}>
                <span>Balance Due</span>
                <span style={{ color: balance > 0 ? "#c0392b" : "#27ae60" }}>₹{balance.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Signature Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 16, borderTop: "1px solid #ddd" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 140, borderBottom: "1px solid #555", height: 36, marginBottom: 4 }} />
                <div style={{ fontSize: 11, color: "#555" }}>Customer Signature</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 10, color: "#888" }}>
                <p>Computer generated invoice.</p>
                <p style={{ marginTop: 3 }}>Thank you for your business.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};