/**
 * Mock Twilio Service
 *
 * Simulates Twilio functionality when credentials are not available.
 * Automatically switches to real Twilio when credentials are provided in .env
 */

export const isMockMode = !process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.startsWith("ACxxxxxxx");

export class MockTwilioProvider {
  /**
   * Generates mock access token
   */
  generateMockToken(identity: string): string {
    return `mock_token_${identity}_${Date.now()}`;
  }

  /**
   * Simulates placing a call
   */
  async mockPlaceCall(toNumber: string, fromNumber: string): Promise<{
    callSid: string;
    status: string;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      callSid: `CA${this.generateRandomString(32)}`,
      status: "queued",
    };
  }

  /**
   * Simulates call progression
   * Returns array of status updates over time
   */
  async *simulateCallProgression(callSid: string, toNumber: string) {
    // Queued
    yield { status: "queued", timestamp: Date.now() };
    await this.delay(1000);

    // Ringing
    yield { status: "ringing", timestamp: Date.now() };
    await this.delay(3000);

    // Randomly decide outcome (80% answered, 10% no-answer, 10% busy)
    const rand = Math.random();
    if (rand < 0.8) {
      // Answered
      yield { status: "in-progress", timestamp: Date.now() };
      await this.delay(10000); // Simulate 10s call

      // Completed
      yield {
        status: "completed",
        timestamp: Date.now(),
        duration: 10,
      };
    } else if (rand < 0.9) {
      // No answer
      await this.delay(20000);
      yield { status: "no-answer", timestamp: Date.now() };
    } else {
      // Busy
      await this.delay(2000);
      yield { status: "busy", timestamp: Date.now() };
    }
  }

  /**
   * Generates mock recording URL
   */
  generateMockRecordingUrl(callSid: string): string {
    return `https://mock-recordings.twilio.com/${callSid}.mp3`;
  }

  /**
   * Generates mock recording bytes (empty audio file)
   */
  generateMockRecordingBytes(): Buffer {
    // Return empty MP3 header (very small valid MP3 file)
    return Buffer.from([
      0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
  }

  private generateRandomString(length: number): string {
    const chars = "0123456789abcdef";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockTwilio = new MockTwilioProvider();
