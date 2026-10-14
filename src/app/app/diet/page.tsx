import { redirect } from 'next/navigation';

export default function DietRedirectPage() {
  redirect('/app/diet-foods');
}
