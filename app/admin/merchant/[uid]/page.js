'use client';
import ProfilePage from '../../../../components/ProfilePage';

export default function Page({ params }) {
  return <ProfilePage mode="admin" uid={params.uid} />;
}
