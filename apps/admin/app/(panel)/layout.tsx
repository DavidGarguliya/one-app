import { ReactNode } from "react";
import { Sidebar } from "../../components/Sidebar";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </>
  );
}
