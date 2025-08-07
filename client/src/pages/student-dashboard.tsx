import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Search, Calendar, MapPin, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/hooks/lib/queryClient";
import Chatbot from '@/components/Chatbot';

// Then add <Chatbot /> at the end of your return statement, just before the closing tag

import { ProfileEditForm } from "@/components/profile-edit-form";
import type { SessionWithVolunteer, BookingWithDetails } from "@shared/schema";

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("browse");
  const [bookingSessionId, setBookingSessionId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useQuery<SessionWithVolunteer[]>({
    queryKey: ['/api/sessions'],
  });

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/bookings/my'],
  });

  const bookedSessionIds = new Set(bookings?.map(b => b.sessionId));

  const bookSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      setBookingSessionId(sessionId);
      const res = await apiRequest("POST", "/api/bookings", { sessionId });
      return await res.json();
    },
    onSuccess: () => {
      setBookingSessionId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({
        title: "Session booked!",
        description: "You have successfully booked this session.",
      });
    },
    onError: (error: Error) => {
      setBookingSessionId(null);
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => logoutMutation.mutate();

  const handleBookSession = (sessionId: number) => {
    if (!bookedSessionIds.has(sessionId)) {
      bookSessionMutation.mutate(sessionId);
    } else {
      toast({
        title: "Already booked",
        description: "You have already booked this session.",
        variant: "default",
      });
    }
  };

  const filteredSessions = sessions?.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.volunteer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.volunteer.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = subjectFilter === "all" || session.subject === subjectFilter;
    const notAlreadyBooked = !bookedSessionIds.has(session.id);
    const hasSpace = session.currentStudents < session.maxStudents;

    return matchesSearch && matchesSubject && hasSpace && notAlreadyBooked;
  });

  const subjects = Array.from(new Set(sessions?.map(s => s.subject) || []));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Book className="text-purple-600 h-8 w-8 mr-2" />
              <span className="text-xl font-bold text-gray-900">EduConnect</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.firstName} {user?.lastName}</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0)}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">Discover new learning opportunities</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Sessions</TabsTrigger>
            <TabsTrigger value="booked">My Booked Sessions</TabsTrigger>
            <TabsTrigger value="profile">Edit Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Error handling */}
            {sessionsError && (
              <Card>
                <CardContent className="text-center py-6 text-red-600">
                  Failed to load sessions: {sessionsError.message}
                </CardContent>
              </Card>
            )}
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search sessions, topics, or volunteer names..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map(subject => (
                          <SelectItem key={subject ?? Math.random()} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Sessions */}
            <div className="space-y-6">
              {sessionsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              ) : filteredSessions && filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{session.title}</h3>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {session.subject}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-4">{session.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                              <span>{new Date(session.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-purple-600" />
                              <span>{new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration} min)</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                              <span>{session.location}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-purple-600" />
                              <span>{session.currentStudents}/{session.maxStudents} students</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600">by </span>
                              <span className="font-medium text-gray-900">
                                {session.volunteer.firstName} {session.volunteer.lastName}
                              </span>
                            </div>
                            {session.requirements && (
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">REQUIREMENTS:</span> {session.requirements}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleBookSession(session.id)}
                          disabled={bookingSessionId === session.id && bookSessionMutation.isPending || session.currentStudents >= session.maxStudents}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {bookingSessionId === session.id && bookSessionMutation.isPending ? "Booking..." : "Book Session"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Book className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria or check back later for new sessions.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="booked" className="space-y-6">
            {/* Error handling */}
            {bookingsError && (
              <Card>
                <CardContent className="text-center py-6 text-red-600">
                  Failed to load bookings: {bookingsError.message}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>My Booked Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <div className="space-y-4">
                    {Array.from(
                      new Map(
                        bookings
                          // Remove expired sessions
                          .filter(b => new Date(b.session.date).getTime() > Date.now())
                          // Deduplicate by session ID
                          .map(b => [b.session.id, b])
                      ).values()
                    ).map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{booking.session.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{booking.session.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span><Calendar className="w-4 h-4 inline mr-1" />{new Date(booking.session.date).toLocaleDateString()}</span>
                              <span><Clock className="w-4 h-4 inline mr-1" />{new Date(booking.session.date).toLocaleTimeString()}</span>
                              <span>📍 {booking.session.location}</span>
                            </div>
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">Instructor: </span>
                              <span className="font-medium text-gray-900">
                                {booking.session.volunteer.firstName} {booking.session.volunteer.lastName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No booked sessions yet</h3>
                    <p className="text-gray-600 mb-6">Browse available sessions and book your first learning session.</p>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => setActiveTab("browse")}
                    >
                      Browse Sessions
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ProfileEditForm />
          </TabsContent>
        </Tabs>
      </div>
      <Chatbot />
    </div>
  );
}