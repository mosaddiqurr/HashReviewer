import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { VerifyPage } from "./pages/VerifyPage";
import { ComparePage } from "./pages/ComparePage";
import { AboutPage } from "./pages/AboutPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const router = createBrowserRouter([{
  element: <Layout />,
  children: [
    { path: "/", element: <HomePage /> },
    { path: "/check", element: <Navigate to="/" replace /> },
    { path: "/verify", element: <VerifyPage /> },
    { path: "/compare", element: <ComparePage /> },
    { path: "/about", element: <AboutPage /> },
    { path: "*", element: <NotFoundPage /> },
  ],
}]);

export function App() { return <RouterProvider router={router} />; }
