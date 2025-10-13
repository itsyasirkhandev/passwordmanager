import Header from "@/components/header";
import PasswordList from "./password-list";

export default function VaultPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          <PasswordList />
        </div>
      </main>
    </div>
  );
}
