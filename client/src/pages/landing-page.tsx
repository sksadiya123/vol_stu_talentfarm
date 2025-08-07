import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Clock, Heart, Book, Rocket, Bolt } from "lucide-react";
import Chatbot from '@/components/Chatbot';

// Add <Chatbot /> at the end of your return statement

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (user.role === 'volunteer') {
        setLocation('/volunteer/dashboard');
      } else {
        setLocation('/student/dashboard');
      }
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Book className="text-purple-600 h-8 w-8 mr-2" />
              <span className="text-xl font-bold text-gray-900">EduConnect</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/auth')}
                className="text-gray-700 hover:text-purple-600"
              >
                Sign In
              </Button>
              <Button
                onClick={() => setLocation('/auth')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-500 min-h-[80vh] flex items-center">
        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="floating-shape absolute top-20 left-10 w-16 h-16 bg-white/10 rounded-full animate-float"></div>
          <div className="floating-shape absolute top-40 right-20 w-12 h-12 bg-pink-300/20 rounded-full animate-float delay-1000"></div>
          <div className="floating-shape absolute bottom-20 left-1/4 w-8 h-8 bg-yellow-300/20 rounded-full animate-float delay-2000"></div>
          <div className="floating-shape absolute top-1/3 right-1/3 w-6 h-6 bg-green-300/20 rounded-full animate-float delay-500"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                <Bolt className="w-4 h-4 mr-2" />
                Transforming Education Worldwide
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Education for <span className="text-pink-300">Everyone</span>
            </h1>
            
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Connect with volunteer educators and unlock your potential. Free, quality education accessible to all, regardless of background or circumstances.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation('/auth')}
                className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Start Learning Today
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation('/auth')}
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 text-lg font-semibold backdrop-blur-sm border-white/30 hover:border-white/50"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-purple-600 mb-2">10,000+</div>
              <div className="text-gray-600 font-medium">Students Helped</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600 font-medium">Volunteer Educators</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-pink-600 mb-2">25,000+</div>
              <div className="text-gray-600 font-medium">Sessions Completed</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-green-500 mb-2">50+</div>
              <div className="text-gray-600 font-medium">Subjects Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose EduConnect?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Democratizing education through technology and human connection
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="text-purple-600 h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Expert Volunteers</h3>
              <p className="text-gray-600">
                Learn from passionate educators who volunteer their time to share knowledge and help you succeed.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="text-blue-600 h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Flexible Schedule</h3>
              <p className="text-gray-600">
                Book sessions that fit your schedule. Learn at your own pace with personalized attention.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Heart className="text-pink-600 h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Completely Free</h3>
              <p className="text-gray-600">
                Access quality education without financial barriers. Our platform is 100% free for learners.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <Chatbot />
      </div>
    </div>
    
  );
}
