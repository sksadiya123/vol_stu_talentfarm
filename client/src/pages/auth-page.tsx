import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, GraduationCap, Presentation, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'volunteer'>('student');
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'volunteer') {
        setLocation('/volunteer/dashboard');
      } else {
        setLocation('/student/dashboard');
      }
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);
  
  const formData = new FormData(e.currentTarget);
  const credentials = {
    username: formData.get('username') as string,
    password: formData.get('password') as string,
  };

  try {
    await loginMutation.mutateAsync(credentials);
    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
    });
  } catch (error) {
    toast({
      title: "Login failed",
      description: "Please check your credentials and try again.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};

 const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);

  const formData = new FormData(e.currentTarget);
  const email = formData.get('email') as string;

  // ✅ Gmail validation here
  if (!email.endsWith("@gmail.com")) {
    toast({
      title: "Invalid email",
      description: "Only Gmail addresses are allowed.",
      variant: "destructive",
    });
    setIsLoading(false);
    return;
  }

  const userData = {
    role: userRole,
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    username: formData.get('username') as string,
    email,
    password: formData.get('password') as string,
    description: formData.get('description') as string,
    educationQualifications: userRole === 'volunteer' ? formData.get('educationQualifications') as string : undefined,
    subjects: userRole === 'volunteer' ? formData.get('subjects') as string : undefined,
    experience: userRole === 'volunteer' ? formData.get('experience') as string : undefined,
  };

  try {
    await registerMutation.mutateAsync(userData);
    toast({
      title: "Account created!",
      description: "Welcome to EduConnect. You can now start your learning journey.",
    });
  } catch (error) {
    toast({
      title: "Registration failed",
      description: "Please check your information and try again.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Book className="h-8 w-8 text-purple-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">EduConnect</span>
            </div>
            <p className="text-gray-600">Join our community of learners and educators</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create your account</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Role Selection */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">I want to:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={userRole === 'student' ? "default" : "outline"}
                        className="p-4 h-auto flex flex-col"
                        onClick={() => setUserRole('student')}
                      >
                        <GraduationCap className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">Learn</span>
                      </Button>
                      <Button
                        type="button"
                        variant={userRole === 'volunteer' ? "default" : "outline"}
                        className="p-4 h-auto flex flex-col"
                        onClick={() => setUserRole('volunteer')}
                      >
                        <Presentation className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">Teach</span>
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          placeholder="John"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="johndoe123"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Create a strong password"
                        required
                      />
                    </div>

                    {userRole === 'volunteer' && (
                      <>
                        <div>
                          <Label htmlFor="educationQualifications">Education Qualifications</Label>
                          <Input
                            id="educationQualifications"
                            name="educationQualifications"
                            placeholder="e.g., Master's in Mathematics"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="subjects">Subjects You Can Teach</Label>
                          <Input
                            id="subjects"
                            name="subjects"
                            placeholder="e.g., Mathematics, Physics, Programming"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="experience">Teaching Experience</Label>
                          <Input
                            id="experience"
                            name="experience"
                            placeholder="e.g., 5 years tutoring experience"
                            required
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label htmlFor="description">
                        {userRole === 'volunteer' ? 'About Yourself' : 'Tell us about yourself'}
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder={
                          userRole === 'volunteer'
                            ? "Tell us about your teaching philosophy and experience..."
                            : "What are your learning goals and interests?"
                        }
                        rows={3}
                        required
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center p-8">
        <div className="text-center text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6">
            Transform Your {userRole === 'volunteer' ? 'Teaching' : 'Learning'} Journey
          </h2>
          <p className="text-purple-100 text-lg mb-8">
            {userRole === 'volunteer'
              ? "Share your knowledge and make a difference in students' lives. Join our community of passionate educators."
              : "Connect with expert volunteers and unlock your potential. Quality education accessible to everyone."
            }
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">10,000+</div>
              <div className="text-purple-200 text-sm">Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold">500+</div>
              <div className="text-purple-200 text-sm">Volunteers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">50+</div>
              <div className="text-purple-200 text-sm">Subjects</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}