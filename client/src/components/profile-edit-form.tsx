import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Upload, User } from "lucide-react";

export function ProfileEditForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      return await res.json();
    },
    onSuccess: (data) => {
      // Update user data in cache
      queryClient.setQueryData(['/api/user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });
      setIsLoading(false);
      
      // Reset file states
      setProfilePictureFile(null);
      setResumeFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'profilePicture' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    if (fileType === 'profilePicture') {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      setProfilePictureFile(file);
    } else if (fileType === 'resume') {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF or Word document.",
          variant: "destructive",
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    // Add files if selected
    if (profilePictureFile) {
      formData.append('profilePicture', profilePictureFile);
    }
    if (resumeFile && user?.role === 'volunteer') {
      formData.append('resume', resumeFile);
    }

    await updateProfileMutation.mutateAsync(formData);
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg overflow-hidden">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                user.firstName?.charAt(0)
              )}
            </div>

            <div>
              <Label htmlFor="profilePicture" className="cursor-pointer">
                <Button type="button" variant="outline" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Change Picture
                  </span>
                </Button>
              </Label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'profilePicture')}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-1">
                {profilePictureFile ? `Selected: ${profilePictureFile.name}` : "JPG, PNG up to 5MB"}
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user.firstName}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user.lastName}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={user.username}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={user.description || ""}
              placeholder={
                user.role === 'volunteer'
                  ? "Tell us about your teaching philosophy and experience..."
                  : "Tell us about your learning goals and interests..."
              }
              rows={4}
            />
          </div>

          {/* Volunteer-specific fields */}
          {user.role === 'volunteer' && (
            <>
              <div>
                <Label htmlFor="education">Education Qualifications</Label>
                <Input
                  id="education"
                  name="education"
                  defaultValue={user.education || ""}
                  placeholder="e.g., Master's in Mathematics"
                />
              </div>

              <div>
                <Label htmlFor="subjects">Subjects You Can Teach</Label>
                <Input
                  id="subjects"
                  name="subjects"
                  defaultValue={user.subjects || ""}
                  placeholder="e.g., Mathematics, Physics, Programming"
                />
              </div>

              <div>
                <Label htmlFor="experience">Teaching Experience</Label>
                <Textarea
                  id="experience"
                  name="experience"
                  defaultValue={user.experience || ""}
                  placeholder="e.g., 5 years tutoring experience"
                  rows={3}
                />
              </div>

              {/* Resume Upload */}
              <div>
                <Label htmlFor="resume">Resume</Label>
                <div className="space-y-2">
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e, 'resume')}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {resumeFile ? `Selected: ${resumeFile.name}` : "PDF, DOC up to 5MB"}
                    </p>
                    {user.resumeUrl && (
                      <a
                        href={user.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline text-sm"
                      >
                        View Current Resume
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}