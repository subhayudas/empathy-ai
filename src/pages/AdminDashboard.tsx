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
import { Star, TrendingUp, MessageSquare, Users, Download, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface FeedbackSession {
  id: string;
  category: "post_visit" | "treatment_experience" | "service_quality";
  satisfaction_score: number | null;
  status: string;
  summary: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Stats {
  totalFeedback: number;
  averageScore: number;
  completedToday: number;
  lowScoreCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  post_visit: "Post-Visit",
  treatment_experience: "Treatment",
  service_quality: "Service Quality",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function AdminDashboardContent() {
  const [sessions, setSessions] = useState<FeedbackSession[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFeedback: 0, averageScore: 0, completedToday: 0, lowScoreCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");

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

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const completedToday = typedData.filter((s) => s.completed_at?.startsWith(today)).length;
      const scoresArray = typedData.filter((s) => s.satisfaction_score).map((s) => s.satisfaction_score!);
      const avgScore = scoresArray.length > 0 ? scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length : 0;
      const lowScores = typedData.filter((s) => s.satisfaction_score && s.satisfaction_score <= 2).length;

      setStats({
        totalFeedback: typedData.length,
        averageScore: Math.round(avgScore * 10) / 10,
        completedToday,
        lowScoreCount: lowScores,
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.summary?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesCategory = categoryFilter === "all" || session.category === categoryFilter;
    const matchesScore = scoreFilter === "all" || 
      (scoreFilter === "low" && session.satisfaction_score && session.satisfaction_score <= 2) ||
      (scoreFilter === "mid" && session.satisfaction_score && session.satisfaction_score === 3) ||
      (scoreFilter === "high" && session.satisfaction_score && session.satisfaction_score >= 4);
    return matchesSearch && matchesCategory && matchesScore;
  });

  const categoryData = Object.entries(
    sessions.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: CATEGORY_LABELS[name] || name, value }));

  const scoreDistribution = [1, 2, 3, 4, 5].map((score) => ({
    score: `${score} Star`,
    count: sessions.filter((s) => s.satisfaction_score === score).length,
  }));

  const exportCSV = () => {
    const headers = ["Date", "Category", "Score", "Summary"];
    const rows = filteredSessions.map((s) => [
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <TabsTrigger value="feedback">All Feedback</TabsTrigger>
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

        <TabsContent value="feedback" className="space-y-4">
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
                    {filteredSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No feedback found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSessions.map((session) => (
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
            <p className="text-muted-foreground">View and manage patient feedback</p>
          </div>
          <AdminDashboardContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}
