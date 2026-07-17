import type { ScalingPolicy } from "./AutoScalingTypes";

// Cloudflare Workers cannot run cloud SDKs directly. Real integrations should
// call the provider HTTP API from here; for now every provider is a logged stub.
export class CloudProviderScaler {
  static async scale(policy: ScalingPolicy, desiredInstances: number): Promise<void> {
    console.log(
      `[CloudProviderScaler:${policy.cloudProvider}] Would scale ${policy.targetResourceId} to ${desiredInstances}`,
    );
  }
}