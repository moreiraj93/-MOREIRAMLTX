# MockJ AI Function V2

This branch adds `mocka-chat-v2` for the official `mockk.online` build.

## What Changed

- Adds `supabase/functions/mocka-chat-v2/index.ts`.
- Adds `supabase/migrations/20250101000000_add_user_daily_usage_rls.sql`.
- Wires the frontend to prefer `mocka-chat-v2`, with fallback to `mocka-chat` if v2 is not deployed yet.
- Keeps the existing `mocka-chat` function intact for rollback.

## Fixed

- Daily usage is per day, not lifetime-only.
- Usage increments are atomic through `increment_user_daily_usage`.
- Failed chat/video upstream calls refund reserved usage.
- Image usage is checked before generation and consumed after a valid image is returned.
- Video creation is metered.
- Image style options visible in the UI are supported server-side.
- `modelVersion` can select an image model through `ONSPACE_IMAGE_MODEL_*` env overrides.
- Upstream calls use a 60 second timeout and retry 429, 503, and 504 responses up to 3 attempts.
- Error responses are standardized and sanitized.

## Deploy Order

1. Apply the Supabase migration.
2. Deploy the `mocka-chat-v2` Supabase function.
3. Publish the frontend build from `main`.
4. Verify `mockk.online` loads the new frontend bundle.
5. Generate one signed-in test image and one video task.

## Rollback

Set `VITE_MOCKJ_AI_FUNCTION_NAME=mocka-chat` in the frontend environment or remove the v2 function deployment. The existing `mocka-chat` function remains in place.

## Notes

For Hugging Face-style image versions, define model overrides such as:

```text
ONSPACE_IMAGE_MODEL_HF_FLUX_DEV=your-supported-onspace-model-id
ONSPACE_IMAGE_MODEL_HF_SDXL=your-supported-onspace-model-id
```

If no override is present, v2 uses the stable MockJ native image model and applies the selected model profile as prompt guidance.
