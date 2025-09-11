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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { createProfile } from "../lib/api";

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

  const [errors, setErrors] = useState<Errors>({});
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectUrl = location.state?.redirectUrl || "/";


  useEffect(() => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (!isLoggedIn) {
        navigate("/");
      }
    }, [navigate]);

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
    onSuccess: (profile: any) => {
      // Store the user's first name in localStorage for display on Home and Dashboard
      if (profile?.firstName) {
        localStorage.setItem("userName", profile.firstName);
      }
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

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 space-y-6"
      autoComplete="off"
    >
      {/* First Name */}
      <div>
        <Label htmlFor="firstName" className="flex items-center gap-2 font-semibold">
          <User size={20} /> First Name
        </Label>
        <Input
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          className={`w-full p-2 ${errors.firstName ? "border-red-500" : ""}`}
          placeholder="John"
        />
        {errors.firstName && (
          <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <Label htmlFor="lastName" className="flex items-center gap-2 font-semibold">
          <UserCheck size={20} /> Last Name
        </Label>
        <Input
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          placeholder="Doe"
          className={`w-full p-2 ${errors.lastName ? "border-red-500" : ""}`}
        />
        {errors.lastName && (
          <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
        )}
      </div>

      {/* Username */}
      <div>
        <Label htmlFor="username" className="flex items-center gap-2 font-semibold">
          <AtSign size={20} /> Username
        </Label>
        <Input
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          placeholder="johndoe123"
          className={`w-full p-2 ${errors.username ? "border-red-500" : ""}`}
        />
        {errors.username && (
          <p className="text-red-600 text-sm mt-1">{errors.username}</p>
        )}
      </div>

      {/* Birthday */}
      <div>
        <Label htmlFor="birthday" className="flex items-center gap-2 font-semibold">
          <Calendar size={20} /> Birthday (MM-DD-YYYY)
        </Label>
        <Input
          id="birthday"
          
          name="birthday"
          value={formData.birthday}
          onChange={handleInputChange}
          placeholder="MM-DD-YYYY"
          className={`w-full p-2 ${errors.birthday ? "border-red-500" : ""}`}
        />
        {errors.birthday && (
          <p className="text-red-600 text-sm mt-1">{errors.birthday}</p>
        )}
      </div>

      {/* Profile Picture */}
      <div>
        <Label htmlFor="profilePic" className="flex items-center gap-2 font-semibold">
          <Image size={20} /> Profile Picture URL
        </Label>
        <Input
          id="profilePic"
          type="file"
          name="profilePic"
          onChange={handleInputChange}
          placeholder="asdasda"
          className={`w-full p-2 ${errors.profilePic ? "border-red-500" : ""}`}
        />
        {errors.profilePic && (
          <p className="text-red-600 text-sm mt-1">{errors.profilePic}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <Label htmlFor="address" className="flex items-center gap-2 font-semibold">
          <MapPin size={20} /> Address
        </Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="123 Main St, City, Country"
          className={`w-full p-2 ${errors.address ? "border-red-500" : ""}`}
        />
        {errors.address && (
          <p className="text-red-600 text-sm mt-1">{errors.address}</p>
        )}
      </div>

      {/* Bio (textarea) */}
      <div>
        <Label htmlFor="bio" className="flex items-center gap-2 font-semibold">
          <FileText size={20} /> Bio
        </Label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Tell us about yourself..."
          maxLength={200}
          rows={4}
          className={`w-full p-2 rounded border resize-none ${
            errors.bio ? "border-red-500" : "border-gray-300"
          }`}
        />
        <p className="text-sm text-gray-500">
          {formData.bio.length}/200 characters
        </p>
        {errors.bio && (
          <p className="text-red-600 text-sm mt-1">{errors.bio}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" variant="hero" className="w-full" disabled={isPending}>
        {isPending ? "Saving profile..." : "Save Profile"}
      </Button>
    </form>
  );
}
