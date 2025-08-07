import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Users, Calendar, Plus, Edit2, Trash2, Eye } from "lucide-react";
import { CreateSessionModal } from "@/components/create-session-modal";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { SessionStudentsModal } from "@/components/session-students-modal";
import { deleteSession } from "@/lib/delete-session";
import type { SessionWithVolunteer } from "@shared/schema";
import Chatbot from '@/components/Chatbot';

// Then add <Chatbot /> at the end of your return statement, just before the closing tag

export default function VolunteerDashboard() {
  const { user, logoutMutation } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedSessionTitle, setSelectedSessionTitle] = useState<string>("");

  const { data: stats } = useQuery({
    queryKey: ['/api/volunteer/stats'],
  });

  const { data: sessions, isLoading, refetch } = useQuery<SessionWithVolunteer[]>({
    queryKey: ['/api/sessions/my'],
  });

  const handleLogout = () => logoutMutation.mutate();

  const handleViewStudents = (sessionId: number, sessionTitle: string) => {
    setSelectedSessionId(sessionId);
    setSelectedSessionTitle(sessionTitle);
  };

  const handleDelete = async (sessionId: number) => {
    const confirmDelete = confirm("Are you sure you want to delete this session?");
    if (!confirmDelete) return;

    try {
      await deleteSession(sessionId);
      alert("Session deleted");
      refetch();
    } catch (err) {
      alert("Failed to delete session");
    }
  };

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
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
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
          <p className="text-gray-600">Manage your sessions and help students learn</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="profile">Edit Profile</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Book className="text-purple-600 h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalSessions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Users className="text-green-600 h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Students Helped</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.studentsHelped || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <Calendar className="text-pink-600 h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.upcomingSessions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Sessions</CardTitle>
                  <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{session.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                              <span><Calendar className="w-4 h-4 inline mr-1" />{new Date(session.date).toLocaleDateString()}</span>
                              <span><Users className="w-4 h-4 inline mr-1" />{session.currentStudents}/{session.maxStudents} students</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Book className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                    <p className="text-gray-600 mb-6">Create your first session to start helping students learn.</p>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
                      Create Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>My Sessions</CardTitle>
                  <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{session.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span><Calendar className="w-4 h-4 inline mr-1" />{new Date(session.date).toLocaleDateString()}</span>
                              <span><Users className="w-4 h-4 inline mr-1" />{session.currentStudents}/{session.maxStudents} students</span>
                              <span>📍 {session.location}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewStudents(session.id, session.title)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Students ({session.currentStudents})
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(session.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions created</h3>
                    <p className="text-gray-600 mb-6">Start by creating your first session to help students learn.</p>
                    <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
                      Create Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileEditForm />
          </TabsContent>
        </Tabs>
      </div>

      <CreateSessionModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      
      <SessionStudentsModal
        isOpen={selectedSessionId !== null}
        onClose={() => setSelectedSessionId(null)}
        sessionId={selectedSessionId || 0}
        sessionTitle={selectedSessionTitle}
      />
      <Chatbot />
    </div>
  );
}
