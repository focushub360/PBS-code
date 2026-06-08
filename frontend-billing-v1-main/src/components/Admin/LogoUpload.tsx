import React, { useState, useRef } from "react";
import { Upload, X, Check, AlertCircle } from "lucide-react";
import { colors } from "../../theme/colors";

// Get API base URL based on environment
const getApiBaseUrl = () => {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
      ? "/api"
      : "https://backend-billing-v1.onrender.com/api")
  );
};

interface LogoUploadProps {
  onUploadSuccess?: () => void;
  currentLogo?: string | null;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({
  onUploadSuccess,
  currentLogo,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | null;
    text: string;
  }>({
    type: null,
    text: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size must be less than 5MB" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Only image files are allowed" });
      return;
    }
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setMessage({ type: null, text: "" });
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const token = sessionStorage.getItem("admin_token");
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/logo/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Logo uploaded successfully!" });
        onUploadSuccess?.();
      } else {
        setMessage({ type: "error", text: result.message || "Upload failed" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete the current logo?")) return;
    setUploading(true);
    try {
      const token = sessionStorage.getItem("admin_token");
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/logo/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Logo deleted successfully!" });
        onUploadSuccess?.();
      } else {
        setMessage({ type: "error", text: result.message || "Delete failed" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setMessage({ type: "error", text: "Delete failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileSelect(files[0]);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-2">
      {/* Two columns: Upload (left) | Preview (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) handleFileSelect(files[0]);
            }}
          />

          <div className="flex flex-col items-center space-y-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary.light}20` }}
            >
              <Upload
                size={24}
                className="text-gray-400"
                style={{ color: colors.primary.medium }}
              />
            </div>

            <div className="text-sm dark:text-white">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded text-white"
                style={{ backgroundColor: colors.primary.dark }}
                disabled={uploading}
              >
                {uploading
                  ? "Uploading..."
                  : currentLogo
                  ? "Upload New Logo"
                  : "Upload Logo"}
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, JPEG • Max 5MB
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-center">
          {currentLogo ? (
            <div className="inline-block relative">
              <img
                src={currentLogo}
                alt="Current Logo"
                className="max-w-32 max-h-32 rounded-md shadow"
              />
              <button
                onClick={handleDelete}
                disabled={uploading}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow disabled:opacity-50"
                title="Delete logo"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              No logo uploaded
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {message.text && (
        <div
          className={`mt-1 p-2 rounded text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};
