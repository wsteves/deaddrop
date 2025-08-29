import React from 'react';
import { Navigate } from 'react-router-dom';

// Legacy page — redirect to the canonical New Job page
export default function NewListing() {
  return <Navigate to="/new" replace />;
}
