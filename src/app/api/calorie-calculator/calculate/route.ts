import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculateCalories,
  CalorieCalculatorInput,
} from '@/lib/domain/calorie-calculator';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user session (supports both cookie session and Authorization Bearer header)
    const supabase = await createClient();
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    const {
      data: { user },
      error: authError,
    } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_JSON',
            message: 'Malformed request JSON payload.',
          },
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'Request body must be a JSON object.',
          },
        },
        { status: 400 }
      );
    }

    const payload = body as Partial<CalorieCalculatorInput>;

    // 3. Domain calculation and runtime validation
    const result = calculateCalories(payload as CalorieCalculatorInput);

    // 4. Return appropriate responses according to docs/09-api-spec.md
    if (result.status === 'underage') {
      return NextResponse.json(
        {
          error: {
            code: result.errorCode,
            message: result.message,
          },
        },
        { status: 422 }
      );
    }

    if (result.status === 'invalid_input') {
      return NextResponse.json(
        {
          error: {
            code: result.errorCode,
            message: result.message,
          },
        },
        { status: 400 }
      );
    }

    if (result.status === 'invalid_calculation') {
      return NextResponse.json(
        {
          error: {
            code: result.errorCode,
            message: result.message,
          },
        },
        { status: 422 }
      );
    }

    if (result.status === 'target_withheld') {
      return NextResponse.json({
        data: {
          status: 'target_withheld',
          bmrKcalPerDay: result.bmrKcalPerDay,
          maintenanceKcalPerDay: result.maintenanceKcalPerDay,
          targetKcalPerDay: null,
          reasonCode: result.reasonCode,
          message: result.message,
        },
      });
    }

    if (result.status === 'calculated') {
      return NextResponse.json({
        data: {
          status: 'calculated',
          bmrKcalPerDay: result.bmrKcalPerDay,
          maintenanceKcalPerDay: result.maintenanceKcalPerDay,
          targetKcalPerDay: result.targetKcalPerDay,
          units: result.units,
          method: result.method,
          estimateDisclaimer: result.estimateDisclaimer,
        },
      });
    }

    return NextResponse.json(
      {
        error: {
          code: 'CALCULATION_ERROR',
          message: 'Unable to calculate calorie target.',
        },
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to complete calorie calculation. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
