import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { useLogo } from "../hooks/useLogo";
import api from "../utils/api";
import { LogoUpload } from "../components/Admin/LogoUpload";
import { colors } from "../theme/colors";

interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileUpdateFormData {
  name: string;
}

const changePassword = async (
  data: Omit<PasswordChangeFormData, "confirmPassword">
) => {
  const response = await api.put("/auth/change-password", data);
  return response.data;
};

const updateProfile = async (data: ProfileUpdateFormData) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

export default function SimpleAdminProfilePage() {
  const { user, updateUser } = useAuth();
  const { logoUrl, refreshLogo } = useLogo();

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileUpdateFormData>({
    defaultValues: { name: user?.name || "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordChangeFormData>();

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast.success("Profile updated");
      if (updateUser) updateUser({ ...user, name: data.user.name });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password changed");
      reset();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to change password"
      );
    },
  });

  const onProfileSubmit = async (data: ProfileUpdateFormData) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const onPasswordSubmit = async (data: PasswordChangeFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    const { confirmPassword, ...payload } = data;
    await changePasswordMutation.mutateAsync(payload);
  };

  const sectionStyle: React.CSSProperties = {
    borderColor: colors.primary[200],
  };
  const sectionTitleStyle: React.CSSProperties = { color: colors.primary.dark };
  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: colors.primary.dark,
  };

  return (
    <div className="w-full p-2 sm:p-3 dark:bg-gray-900 min-h-screen">
      <h1
        className="text-xl sm:text-2xl font-semibold mb-2 dark:text-white"
        style={sectionTitleStyle}
      >
        Admin Profile
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* Profile */}
        <section
          className="space-y-2 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          style={sectionStyle}
        >
          <h2
            className="text-base sm:text-lg font-medium dark:text-white"
            style={sectionTitleStyle}
          >
            Profile
          </h2>

          <form
            onSubmit={handleSubmitProfile(onProfileSubmit)}
            className="space-y-2"
          >
            <div>
              <label className="block text-xs mb-1 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Your name"
                {...registerProfile("name", {
                  required: "Required",
                  minLength: { value: 2, message: "Min 2 characters" },
                })}
              />
              {profileErrors.name && (
                <p className="text-xs text-red-600 mt-0.5">
                  {profileErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs mb-1 dark:text-gray-300">
                Email
              </label>
              <input
                className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={user?.email || ""}
                readOnly
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3 py-1.5 rounded text-white text-sm"
                style={primaryButtonStyle}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          <div className="border-t border-gray-600/30 pt-2 mt-2">
            <h3
              className="text-sm font-medium dark:text-white mb-2"
              style={sectionTitleStyle}
            >
              Change Password
            </h3>
            <form
              onSubmit={handleSubmit(onPasswordSubmit)}
              className="grid grid-cols-1 md:grid-cols-3 gap-2.5"
            >
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="••••••••"
                  {...register("currentPassword", { required: "Required" })}
                />
                {errors.currentPassword && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="••••••••"
                  {...register("newPassword", {
                    required: "Required",
                    minLength: { value: 8, message: "Min 8 characters" },
                  })}
                />
                {errors.newPassword && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs mb-1 dark:text-gray-300">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full px-2 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="••••••••"
                  {...register("confirmPassword", { required: "Required" })}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded text-white text-sm"
                  style={primaryButtonStyle}
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending
                    ? "Changing..."
                    : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Logo */}
        <section
          className="space-y-2 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          style={sectionStyle}
        >
          <h2
            className="text-base sm:text-lg font-medium dark:text-white"
            style={sectionTitleStyle}
          >
            Shop Logo
          </h2>
          <LogoUpload currentLogo={logoUrl} onUploadSuccess={refreshLogo} />
        </section>
      </div>
    </div>
  );
}
