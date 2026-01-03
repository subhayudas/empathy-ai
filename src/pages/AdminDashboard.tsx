import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Star, TrendingUp, MessageSquare, Users, Download, Search, AlertTriangle, Stethoscope, User, DoorOpen, Activity, Heart } from "lucide-react";
import { format } from "date-fns";

interface FeedbackSession {
  id: string;
  category: "post_visit" | "treatment_experience" | "service_quality" | "nursing_assessment";
  satisfaction_score: number | null;
  status: string;
  summary: string | null;
  created_at: string;
  completed_at: string | null;
  is_nursing_assessment: boolean | null;
  patient_name: string | null;
  room_number: string | null;
  condition_summary: string | null;
  mood_assessment: string | null;
  immediate_needs: string[] | null;
  priority_level: string | null;
}

interface Stats {
  totalFeedback: number;
  averageScore: number;
  completedToday: number;
  lowScoreCount: number;
}

interface NursingStats {
  totalAssessments: number;
  urgentCount: number;
  highPriorityCount: number;
  todayCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  post_visit: "Post-Visit",
  treatment_experience: "Treatment",
  service_quality: "Service Quality",
  nursing_assessment: "Nursing",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const moodIcons: Record<string, string> = {
  calm: "😌",
  content: "😊",
  anxious: "😟",
  uncomfortable: "😣",
  distressed: "😰",
};

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
};

function AdminDashboardContent() {
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFeedback: 0, averageScore: 0, completedToday: 0, lowScoreCount: 0 });
  const [nursingStats, setNursingStats] = useState<NursingStats>({ totalAssessments: 0, urgentCount: 0, highPriorityCount: 0, todayCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [nursingSearchTerm, setNursingSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedback_sessions")
        .select("*")
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as FeedbackSession[];
      setSessions(typedData);

      // Calculate feedback stats (non-nursing)
      const feedbackSessions = typedData.filter((s) => !s.is_nursing_assessment);
      const today = new Date().toISOString().split("T")[0];
      const completedToday = feedbackSessions.filter((s) => s.completed_at?.startsWith(today)).length;
      const scoresArray = feedbackSessions.filter((s) => s.satisfaction_score).map((s) => s.satisfaction_score!);
      const avgScore = scoresArray.length > 0 ? scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length : 0;
      const lowScores = feedbackSessions.filter((s) => s.satisfaction_score && s.satisfaction_score <= 2).length;

      setStats({
        totalFeedback: feedbackSessions.length,
        averageScore: Math.round(avgScore * 10) / 10,
        completedToday,
        lowScoreCount: lowScores,
      });

      // Calculate nursing stats
      const nursingSessions = typedData.filter((s) => s.is_nursing_assessment);
      const nursingToday = nursingSessions.filter((s) => s.completed_at?.startsWith(today)).length;
      const urgentCount = nursingSessions.filter((s) => s.priority_level === "urgent").length;
      const highPriorityCount = nursingSessions.filter((s) => s.priority_level === "high").length;

      setNursingStats({
        totalAssessments: nursingSessions.length,
        urgentCount,
        highPriorityCount,
        todayCount: nursingToday,
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const feedbackSessions = sessions.filter((s) => !s.is_nursing_assessment);
  const nursingSessions = sessions.filter((s) => s.is_nursing_assessment);

  const filteredFeedbackSessions = feedbackSessions.filter((session) => {
    const matchesSearch = session.summary?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesCategory = categoryFilter === "all" || session.category === categoryFilter;
    const matchesScore = scoreFilter === "all" || 
      (scoreFilter === "low" && session.satisfaction_score && session.satisfaction_score <= 2) ||
      (scoreFilter === "mid" && session.satisfaction_score && session.satisfaction_score === 3) ||
      (scoreFilter === "high" && session.satisfaction_score && session.satisfaction_score >= 4);
    return matchesSearch && matchesCategory && matchesScore;
  });

  const filteredNursingSessions = nursingSessions.filter((session) => {
    const matchesSearch = 
      session.patient_name?.toLowerCase().includes(nursingSearchTerm.toLowerCase()) ||
      session.room_number?.toLowerCase().includes(nursingSearchTerm.toLowerCase()) ||
      session.condition_summary?.toLowerCase().includes(nursingSearchTerm.toLowerCase()) ||
      false;
    const matchesPriority = priorityFilter === "all" || session.priority_level === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const categoryData = Object.entries(
    feedbackSessions.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: CATEGORY_LABELS[name] || name, value }));

  const scoreDistribution = [1, 2, 3, 4, 5].map((score) => ({
    score: `${score} Star`,
    count: feedbackSessions.filter((s) => s.satisfaction_score === score).length,
  }));

  const exportCSV = () => {
    const headers = ["Date", "Category", "Score", "Summary"];
    const rows = filteredFeedbackSessions.map((s) => [
      s.completed_at ? format(new Date(s.completed_at), "yyyy-MM-dd HH:mm") : "",
      CATEGORY_LABELS[s.category] || s.category,
      s.satisfaction_score?.toString() || "",
      `"${(s.summary || "").replace(/"/g, '""')}"`,
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const exportNursingCSV = () => {
    const headers = ["Date", "Patient", "Room", "Priority", "Mood", "Condition", "Needs"];
    const rows = filteredNursingSessions.map((s) => [
      s.completed_at ? format(new Date(s.completed_at), "yyyy-MM-dd HH:mm") : "",
      s.patient_name || "",
      s.room_number || "",
      s.priority_level || "",
      s.mood_assessment || "",
      `"${(s.condition_summary || "").replace(/"/g, '""')}"`,
      `"${(s.immediate_needs || []).join(", ")}"`,
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nursing-assessments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="feedback" className="space-y-4">
        <TabsList>
          <TabsTrigger value="feedback">Patient Feedback</TabsTrigger>
          <TabsTrigger value="nursing" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Patient Status
            {nursingStats.urgentCount > 0 && (
              <Badge variant="destructive" className="ml-1">{nursingStats.urgentCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Patient Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFeedback}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageScore}/5</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedToday}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Scores (1-2)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.lowScoreCount}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="all">All Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                    <CardDescription>Satisfaction scores across all feedback</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="score" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feedback by Category</CardTitle>
                    <CardDescription>Distribution across feedback types</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>All Feedback</CardTitle>
                      <CardDescription>View and filter patient feedback</CardDescription>
                    </div>
                    <Button variant="outline" onClick={exportCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search feedback..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="post_visit">Post-Visit</SelectItem>
                        <SelectItem value="treatment_experience">Treatment</SelectItem>
                        <SelectItem value="service_quality">Service Quality</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={scoreFilter} onValueChange={setScoreFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Score" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Scores</SelectItem>
                        <SelectItem value="low">Low (1-2)</SelectItem>
                        <SelectItem value="mid">Medium (3)</SelectItem>
                        <SelectItem value="high">High (4-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead className="hidden md:table-cell">Summary</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFeedbackSessions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No feedback found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredFeedbackSessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell>
                                {session.completed_at
                                  ? format(new Date(session.completed_at), "MMM d, yyyy")
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {CATEGORY_LABELS[session.category] || session.category}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {session.satisfaction_score && session.satisfaction_score <= 2 ? (
                                    <span className="text-destructive font-medium">{session.satisfaction_score}/5</span>
                                  ) : (
                                    <span>{session.satisfaction_score}/5</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell max-w-md truncate">
                                {session.summary || "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Patient Status (Nursing) Tab */}
        <TabsContent value="nursing" className="space-y-6">
          {/* Nursing Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                <Stethoscope className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nursingStats.totalAssessments}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Urgent Patients</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{nursingStats.urgentCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <Activity className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{nursingStats.highPriorityCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nursingStats.todayCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Status List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Patient Status Board</CardTitle>
                  <CardDescription>View and monitor admitted patient assessments</CardDescription>
                </div>
                <Button variant="outline" onClick={exportNursingCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name, room, or condition..."
                    value={nursingSearchTerm}
                    onChange={(e) => setNursingSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredNursingSessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No nursing assessments found
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredNursingSessions.map((session) => (
                    <Card key={session.id} className="relative overflow-hidden">
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        session.priority_level === "urgent" ? "bg-red-500" :
                        session.priority_level === "high" ? "bg-orange-500" :
                        session.priority_level === "medium" ? "bg-yellow-500" : "bg-green-500"
                      }`} />
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">{session.patient_name}</CardTitle>
                          </div>
                          <Badge className={priorityColors[session.priority_level || "low"]}>
                            {session.priority_level?.charAt(0).toUpperCase() + (session.priority_level?.slice(1) || "")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DoorOpen className="h-4 w-4" />
                          <span>Room {session.room_number}</span>
                          <span className="mx-2">•</span>
                          <span>{session.completed_at ? format(new Date(session.completed_at), "MMM d, h:mm a") : ""}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Mood */}
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Mood:</span>
                          <span className="text-xl">{moodIcons[session.mood_assessment || ""] || "😐"}</span>
                          <span className="text-sm capitalize">{session.mood_assessment}</span>
                        </div>

                        {/* Condition */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Condition</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {session.condition_summary || "No condition summary"}
                          </p>
                        </div>

                        {/* Immediate Needs */}
                        {session.immediate_needs && session.immediate_needs.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-sm font-medium">Immediate Needs</span>
                            <div className="flex flex-wrap gap-1">
                              {session.immediate_needs.map((need, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {need}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">View and manage patient feedback and nursing assessments</p>
          </div>
          <AdminDashboardContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}
