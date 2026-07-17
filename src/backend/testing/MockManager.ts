import type { MockConfig, MockType } from "./TestingFrameworkTypes";

export class MockManager {
  private mocks: MockConfig[];
  private callCounts: Map<string, number> = new Map();
  private active = false;

  constructor(mocks: MockConfig[]) {
    this.mocks = mocks || [];
  }

  async activate(): Promise<void> {
    this.active = true;
    this.callCounts.clear();
  }

  async deactivate(): Promise<void> {
    this.active = false;
  }

  getMockResponse(type: MockType, targetName: string, args?: any): any {
    if (!this.active) return null;
    const mock = this.mocks.find(
      (m) =>
        m.type === type &&
        m.targetName === targetName &&
        (!m.matchArgs || JSON.stringify(m.args) === JSON.stringify(args)),
    );
    if (!mock) return null;
    const callKey = `${type}:${targetName}`;
    const currentCount = this.callCounts.get(callKey) || 0;
    if (mock.callLimit && currentCount >= mock.callLimit) return null;
    this.callCounts.set(callKey, currentCount + 1);
    if (mock.error) throw new Error(mock.error);
    return mock.response;
  }

  getCallCount(type: MockType, targetName: string): number {
    return this.callCounts.get(`${type}:${targetName}`) || 0;
  }

  resetCallCounts(): void {
    this.callCounts.clear();
  }
}