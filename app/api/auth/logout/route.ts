
import { successResponse } from '@/lib/response';

export async function POST() {
    const response = successResponse(null, 'Logged out successfully');

    response.cookies.delete('token_mobi');

    return response;
}
