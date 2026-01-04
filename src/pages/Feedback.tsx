import { Header } from "@/components/layout/Header";
import { CategorySelector } from "@/components/feedback/CategorySelector";

export default function Feedback() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <CategorySelector />
      </main>
    </div>
  );
}
