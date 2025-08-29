
import { Navigate, useParams } from 'react-router-dom';

export default function ListingDetail() {
  // Legacy page kept for compatibility — redirect to canonical job detail route
  const { id } = useParams();
  if (!id) return <div className="p-8 text-center">Invalid id</div>;
  return <Navigate to={`/job/${id}`} replace />;
}
