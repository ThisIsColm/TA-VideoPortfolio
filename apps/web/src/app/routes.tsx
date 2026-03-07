import { createBrowserRouter, Navigate } from 'react-router';
import CollectionPage from './pages/CollectionPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import PostsBrowser from './pages/PostsBrowser';
import CreateCollection from './pages/CreateCollection';
import EditCollection from './pages/EditCollection';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/p/:slug',
    Component: CollectionPage,
  },
  {
    path: '/p/:slug/:postSlug',
    Component: CollectionPage,
  },
  {
    path: '/dashboard',
    Component: DashboardLayout,
    children: [
      {
        index: true,
        Component: DashboardHome,
      },

      {
        path: 'collections/new',
        Component: CreateCollection,
      },
      {
        path: 'collections/:id/edit',
        Component: EditCollection,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    Component: NotFound,
  },
]);
