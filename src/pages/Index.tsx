import { FileText, AlertTriangle, DollarSign, TrendingUp, FileSpreadsheet, BarChart3, List, LayoutGrid, Menu } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { TaskListView } from "@/components/TaskListView";
import { KanbanBoard } from "@/components/KanbanBoard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ManagerRequestsDropdown } from "@/components/ManagerRequestsDropdown";
import { useStats } from "@/hooks/useStats";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ReminderBanner } from "@/components/ReminderBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const stats = useStats();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile, toggle with menu button */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="md:mr-16 p-4 md:p-6">
        {/* Header */}
        <header className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                سیستم مدیریت قراردادها
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                پیگیری و نظارت بر قراردادها و پروژه‌ها
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <ManagerRequestsDropdown />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open('https://docs.google.com/spreadsheets/d/11KUMumbPyz_QxrU4mx0-4rm2fKG-x3UOxCelNTo9OQU', '_blank')}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">گوگل شیت</span>
            </Button>
            <ModeToggle />
          </div>
        </header>

        {/* Reminder Banner */}
        <ReminderBanner />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
          <StatCard
            title="کل قراردادها"
            value={stats.total.toLocaleString('fa-IR')}
            icon={FileText}
            delay={0}
          />
          <StatCard
            title="موارد اضطراری"
            value={stats.urgent.toLocaleString('fa-IR')}
            icon={AlertTriangle}
            delay={100}
          />
          <StatCard
            title="بودجه (میلیارد)"
            value={stats.budgetFormatted}
            icon={DollarSign}
            delay={200}
          />
          <StatCard
            title="پیشرفت"
            value={`${stats.progress.toLocaleString('fa-IR')}٪`}
            icon={TrendingUp}
            delay={300}
          />
        </div>

        {/* View Tabs - Bordio Style */}
        <Tabs defaultValue="list" className="w-full" dir="rtl">
          <div className="flex items-center justify-center mb-4 md:mb-6">
            <TabsList className="bg-muted/50 p-1 rounded-full">
              <TabsTrigger
                value="list"
                className="gap-1 md:gap-2 rounded-full px-2 md:px-4 text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">لیست کارها</span>
              </TabsTrigger>
              <TabsTrigger
                value="kanban"
                className="gap-1 md:gap-2 rounded-full px-2 md:px-4 text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">برد کانبان</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="gap-1 md:gap-2 rounded-full px-2 md:px-4 text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">تحلیل‌ها</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="mt-0">
            <TaskListView />
          </TabsContent>

          <TabsContent value="kanban" className="mt-0">
            <KanbanBoard />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;




