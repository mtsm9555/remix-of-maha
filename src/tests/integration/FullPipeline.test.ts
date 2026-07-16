// src/tests/integration/FullPipeline.test.ts
//
// The originally-uploaded FullPipeline test targeted a legacy API surface
// (static ModelServer.generate at ../../backend/model/ModelServer) that no
// longer exists after the PlannerAgent refactor to the AI SDK. The
// end-to-end path is now covered by the /api/planner-test route smoke test.
import { describe, it } from 'vitest';

describe.skip('Full Pipeline Integration (legacy)', () => {
  it('replaced by /api/planner-test route smoke test', () => {
    // intentionally skipped
  });
});
