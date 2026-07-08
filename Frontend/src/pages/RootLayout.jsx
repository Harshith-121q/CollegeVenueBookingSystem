import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

export default function RootLayout() {
  return (
    <div>
        <Header/>
        <Sidebar/>
        <div className="min-h-screen mx-32">
            <Outlet/>
        </div>
        <Footer/>
    </div>    
  )
}
