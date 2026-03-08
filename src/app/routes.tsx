import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import Home from "./components/Home";
import Messages from "./components/Messages";
import Profile from "./components/Profile";
import Settings from "./components/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Auth },
      { path: "onboarding", Component: Onboarding },
      { path: "home", Component: Home },
      { path: "messages", Component: Messages },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
]);