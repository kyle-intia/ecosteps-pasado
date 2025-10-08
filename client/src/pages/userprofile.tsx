import { useEffect, useState } from "react";
import {
  User,
  UserCheck,
  Calendar,
  Image,
  MapPin,
  FileText,
  AtSign,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { createProfile, userProfileDone } from "../lib/api";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import BirthdayDropdown from "@/components/BirthdayDropdown";

type FormData = {
  firstName: string;
  lastName: string;
  username: string;
  birthday: string;
  profilePic: File | null;
  address: string;
  bio: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

export default function CreateProfile() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    birthday: "",
    profilePic: null,
    address: "",
    bio: "",
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectUrl = location.state?.redirectUrl || "/";
  const { isPending: sessionPending } = useSessionStatus();

  useEffect(() => {
    const checkAssessmentStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/user/status`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data?.userProfileDone) {
          navigate("/home", { replace: true });
        }
      } catch (error) {
        console.error("Error checking assessment status:", error);
      }
    };

    checkAssessmentStatus();
  }, [navigate]);

  useEffect(() => {
    if (formData.profilePic) {
      const url = URL.createObjectURL(formData.profilePic);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.profilePic]);

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required.";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters.";
    }

    if (!formData.birthday.trim()) {
      newErrors.birthday = "Birthday is required.";
    } else if (!/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/.test(formData.birthday.trim())) {
      newErrors.birthday = "Enter a valid date in MM-DD-YYYY format.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required.";
    } else if (formData.bio.length > 200) {
      newErrors.bio = "Bio must be 200 characters or less.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const {
    mutate: userProfile,
    isPending,
  } = useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      toast({
        title: "Profile Complete!",
        description: "You've successfully completed the profile page.",
      });
      navigate(redirectUrl, { replace: true });
    },
    onError: (error: any) => {
      toast({
        title: "Something went wrong",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          payload.append(key, value);
        } else if (value !== null) {
          payload.append(key, value);
        }
      });

      userProfile(payload);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;

    if (e.target instanceof HTMLInputElement && e.target.type === "file") {
      const file = e.target.files?.[0] || null;
      setFormData((prev) => ({ ...prev, [name]: file }));
    } else {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (sessionPending) {
    return <Spinner />;
  }

  return (
    
  
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto p-6 bg-white shadow-sm rounded-2xl"
      autoComplete="off"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>
      <div className="flex flex-col md:grid md:grid-cols-10 gap-10">
        <div className="col-span-4 space-y-4 flex flex-col items-center">
          <div className="flex justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <Image size={32} className="text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="profilePic"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Image size={16} /> Profile Picture
            </label>
            <input
              id="profilePic"
              type="file"
              name="profilePic"
              onChange={handleInputChange}
              className="mt-1 w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm text-gray-900 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {errors.profilePic && (
              <p className="text-red-500 text-xs mt-1">{errors.profilePic}</p>
            )}
          </div>
        </div>

        <div className=" col-span-6 space-y-4">
          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <User size={16} /> First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`mt-1 w-full p-2 rounded-lg border ${errors.firstName ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm text-gray-900 placeholder-gray-400`}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>
          
          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <UserCheck size={16} /> Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`mt-1 w-full p-2 rounded-lg border ${errors.lastName ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm text-gray-900 placeholder-gray-400`}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
          
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <AtSign size={16} /> Username
            </label>
            <input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`mt-1 w-full p-2 rounded-lg border ${errors.username ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm text-gray-900 placeholder-gray-400`}
              placeholder="johndoe123"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>
          
          {/* Birthday */}
          <div>
            <label
              htmlFor="birthday"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Calendar size={16} /> Birthday (MM-DD-YYYY)
            </label>
            <BirthdayDropdown
              value={formData.birthday}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, birthday: value }))
              }
              error={errors.birthday}
            />
            {errors.birthday && (
              <p className="text-red-500 text-xs mt-1">{errors.birthday}</p>
            )}
          </div>
          
          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <MapPin size={16} /> Address
            </label>
            <input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className={`mt-1 w-full p-2 rounded-lg border ${errors.address ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm text-gray-900 placeholder-gray-400`}
              placeholder="123 Main St, City, Country"
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address}</p>
            )}
          </div>
          
          {/* Bio (textarea) */}
          <div>
            <label
              htmlFor="bio"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <FileText size={16} /> Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              maxLength={200}
              rows={3}
              className={`mt-1 w-full p-2 rounded-lg border ${errors.bio ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm text-gray-900 placeholder-gray-400 resize-none`}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/200 characters
            </p>
            {errors.bio && (
              <p className="text-red-500 text-xs mt-1">{errors.bio}</p>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2 px-3 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending}
          >
            {isPending ? "Saving profile..." : "Save Profile"}
          </button>
        </div>
      </div>
    </form>
  );
}