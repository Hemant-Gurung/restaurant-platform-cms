import { RootLayout } from "@payloadcms/next/layouts";
import { importMap } from "@/app/(payload)/admin/importMap.js";
import { serverFunction } from "@/actions";
import config from "@payload-config";
import React from "react";
import "@payloadcms/next/css";
import "@/styles/payloadStyles.css";

type Args = {
  children: React.ReactNode;
};

const Layout = ({ children }: Args) =>
  RootLayout({
    children,
    config,
    importMap,
    serverFunction,
  });

export default Layout;
