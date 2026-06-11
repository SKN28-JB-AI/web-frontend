import { createBrowserRouter, Navigate } from "react-router";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Callback from "./pages/Callback.jsx";
import Home from "./pages/Home.jsx";
import VideoPrompt from "./pages/mma/VideoPrompt.jsx";
import JobList from "./pages/mma/JobList.jsx";
import JobDetail from "./pages/mma/JobDetail.jsx";
import AdsList from "./pages/mma/AdsList.jsx";
import AdsStoryboard from "./pages/mma/AdsStoryboard.jsx";
import AdsPipeline from "./pages/mma/AdsPipeline.jsx";
import TranslationPrompt from "./pages/translation/TranslationPrompt.jsx";
import RecommendationPrompt from "./pages/recommendation/RecommendationPrompt.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/callback", element: <Callback /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      // multi_modal_agent
      { path: "mma/videos", element: <VideoPrompt /> },
      { path: "mma/jobs", element: <JobList /> },
      { path: "mma/jobs/:jobId", element: <JobDetail /> },
      { path: "mma/ads", element: <AdsList /> },
      { path: "mma/ads/new", element: <AdsStoryboard /> },
      { path: "mma/ads/:jobId", element: <AdsPipeline /> },
      // 관리자 전용
      { path: "admin/users", element: <AdminUsers /> },
      // 미구현 에이전트 (빈 프롬프트 페이지)
      { path: "translation", element: <TranslationPrompt /> },
      { path: "recommendation", element: <RecommendationPrompt /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
