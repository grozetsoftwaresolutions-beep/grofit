import { DELETE } from '../route';

export async function POST(request: Request) {
  return DELETE(request);
}

export { DELETE };
