## Cake Quality Control Agent 📸🎂

AI-powered quality control system for finished cakes using computer vision and OCR.

### Features

✅ **AI Vision Analysis** - Analyzes cake photos with Claude Vision or OpenAI GPT-4 Vision
✅ **Text Recognition (OCR)** - Reads messages written on cakes
✅ **Spelling Verification** - Detects spelling mistakes automatically
✅ **Order Verification** - Compares cake to original order details
✅ **Quality Scoring** - Rates cakes on decoration, cleanliness, presentation
✅ **Issue Detection** - Flags problems like smudges, crooked text, wrong colors
✅ **Auto-Approval** - Automatically approves high-quality cakes
✅ **Review Queue** - Flags cakes that need human review

### How It Works

```
Staff uploads photo → AI analyzes → Checks spelling → Verifies order → Scores quality → Approve/Reject
```

1. Staff uploads finished cake photo
2. AI extracts text from cake (OCR)
3. Checks spelling against order
4. Scores visual quality (0-10)
5. Detects issues (smudges, alignment, etc.)
6. Auto-approves or flags for review

### Quick Start

#### 1. Database Setup

```bash
# Run in Supabase SQL Editor
# File: typescript/supabase-examples/database/quality-control-schema.sql
```

#### 2. Create Storage Bucket

In Supabase Dashboard → Storage:
```sql
-- Create bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('cake-photos', 'cake-photos', true);
```

#### 3. Set Environment Variables

```bash
# In Supabase Dashboard → Edge Functions → Secrets

# Choose AI Provider:
AI_PROVIDER=anthropic  # or 'openai'

# Add API Key:
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
```

#### 4. Deploy Edge Function

```bash
cd your-project
supabase functions deploy quality-control
```

#### 5. Add React Component

```tsx
import CakeQualityControl from './CakeQualityControl';

function App() {
  return <CakeQualityControl />;
}
```

### Usage

#### From Staff Interface

```typescript
// Upload and analyze automatically
const { data } = await supabase.functions.invoke('quality-control', {
  body: formData  // Contains file and orderId
});

console.log(data.qc_result);
// {
//   approved: true,
//   quality_score: 9.2,
//   spelling_correct: true,
//   text_on_cake: "Happy Birthday Sarah!",
//   issues_detected: []
// }
```

#### Programmatic Usage

```typescript
import { CakeQualityControlAgent } from './CakeQualityControlAgent';

const agent = new CakeQualityControlAgent({
  supabaseClient: supabase,
  aiProvider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  checkSpelling: true,
  verifyOrder: true,
  minimumQualityScore: 7.0,
  autoApprove: true,
});

const result = await agent.execute({
  order_id: 'order-uuid',
  image_url: 'https://...',
});

if (result.approved) {
  console.log('✓ Cake approved!');
} else {
  console.log('✗ Issues:', result.issues_detected);
}
```

### Configuration

```typescript
interface QualityControlConfig {
  supabaseClient: SupabaseClient;  // Required

  // AI Provider
  aiProvider?: 'anthropic' | 'openai';  // default: 'anthropic'
  apiKey?: string;                      // Your AI API key

  // Quality settings
  minimumQualityScore?: number;         // default: 7.0
  autoApprove?: boolean;                // default: false

  // Analysis options
  checkSpelling?: boolean;              // default: true
  verifyOrder?: boolean;                // default: true
  detectIssues?: boolean;               // default: true
}
```

### AI Providers

#### Anthropic Claude (Recommended)

Best for:
- Accurate text recognition
- Detailed analysis
- Better with cursive writing
- Higher accuracy

Setup:
```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

Cost: ~$0.01 per image (Claude 3.5 Sonnet)

#### OpenAI GPT-4 Vision

Best for:
- Faster processing
- Good for simple text
- Lower latency

Setup:
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

Cost: ~$0.01 per image (GPT-4o)

### Order Requirements

Your orders table should have:

```sql
ALTER TABLE orders ADD COLUMN message_on_cake TEXT;
ALTER TABLE orders ADD COLUMN decoration_notes TEXT;
ALTER TABLE orders ADD COLUMN color_scheme TEXT;
ALTER TABLE orders ADD COLUMN special_instructions TEXT;
ALTER TABLE orders ADD COLUMN qc_status TEXT DEFAULT 'pending';
```

### Example Results

#### ✅ Passed Quality Check

```json
{
  "quality_score": 9.2,
  "text_on_cake": "Happy Birthday Sarah!",
  "spelling_correct": true,
  "spelling_errors": [],
  "matches_order": true,
  "order_discrepancies": [],
  "visual_quality": {
    "decoration": 9.5,
    "cleanliness": 9.0,
    "presentation": 9.0,
    "color_accuracy": 9.5
  },
  "issues_detected": [],
  "approved": true,
  "requires_review": false,
  "ai_confidence": 0.95
}
```

#### ❌ Failed - Spelling Error

```json
{
  "quality_score": 6.5,
  "text_on_cake": "Happy Brithday Sarah!",
  "spelling_correct": false,
  "spelling_errors": [
    "Word 2: Expected 'birthday', found 'brithday'"
  ],
  "matches_order": false,
  "issues_detected": ["Text spelling mismatch"],
  "approved": false,
  "requires_review": true,
  "ai_confidence": 0.92
}
```

#### ⚠️ Needs Review - Quality Issues

```json
{
  "quality_score": 6.8,
  "visual_quality": {
    "decoration": 7.5,
    "cleanliness": 6.0,
    "presentation": 7.0,
    "color_accuracy": 7.0
  },
  "issues_detected": [
    "Slight smudge on left edge",
    "Text slightly crooked",
    "Frosting appears uneven in corner"
  ],
  "approved": false,
  "requires_review": true
}
```

### React Component Features

The provided React component includes:

- **Order Selection** - Pick from list of orders needing QC
- **Drag & Drop Upload** - Easy photo upload
- **Real-time Analysis** - Instant AI feedback
- **Visual Indicators** - Color-coded scores
- **Issue Highlighting** - Clear problem display
- **Spelling Errors** - Highlighted with corrections
- **Manual Override** - Approve/reject buttons
- **QC History** - View past results

### Database Queries

#### Get Orders Needing QC

```sql
SELECT * FROM orders_pending_qc;
```

#### Get Failed Cakes

```sql
SELECT * FROM qc_failed_cakes;
```

#### Get QC Stats

```sql
SELECT * FROM qc_statistics
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

#### Get QC Summary for Order

```sql
SELECT * FROM get_qc_summary('order-uuid');
```

### Workflows

#### Workflow 1: Standard QC Process

1. Baker finishes cake
2. Staff uploads photo
3. AI analyzes automatically
4. If approved → mark order complete
5. If issues → flag for supervisor review

#### Workflow 2: Batch Processing

```typescript
const agent = new CakeQualityControlAgent(config);

const photos = await fetchPendingPhotos();
const results = await agent.processBatch(photos);

const failed = results.filter(r => !r.approved);
console.log(`${failed.length} cakes need attention`);
```

#### Workflow 3: Pre-Delivery Check

```typescript
// Before delivery, verify QC passed
const qcHistory = await agent.getOrderQCHistory(orderId);
const latestCheck = qcHistory[0];

if (!latestCheck?.approved) {
  throw new Error('Cake failed quality control');
}
```

### Training the AI

The AI learns from your order data:

1. **Be Specific in Orders** - Clear messages and notes
2. **Consistent Format** - Use same terminology
3. **Review Results** - Check AI accuracy
4. **Adjust Thresholds** - Fine-tune quality scores

### Troubleshooting

#### AI Can't Read Text

**Causes:**
- Poor lighting
- Text too small
- Cursive too stylized
- Low image quality

**Solutions:**
- Use better lighting
- Take photo straight-on
- Use higher resolution
- Try different angle

#### False Spelling Errors

**Causes:**
- AI misread text
- Unusual names/words
- Decorative font

**Solutions:**
- Manual review and override
- Add custom dictionary
- Improve photo quality

#### Low Quality Scores

**Causes:**
- Photo angle issues
- Lighting problems
- AI calibration

**Solutions:**
- Check photo quality
- Adjust minimum score threshold
- Review AI confidence level

### Best Practices

1. **Good Lighting** - Natural light or bright LED
2. **Straight Angle** - Photo from directly above
3. **Full Cake View** - Capture entire cake
4. **High Resolution** - Use good camera
5. **Clean Background** - Plain white surface
6. **Immediate Upload** - Upload right after finishing
7. **Double Check** - Review AI results
8. **Track Patterns** - Monitor common issues

### Costs

Approximate costs per cake:

- **Claude 3.5 Sonnet**: ~$0.01
- **GPT-4o**: ~$0.01
- **Storage**: <$0.001
- **Database**: negligible

For 100 cakes/day = ~$1/day = ~$30/month

### Security

- ✅ RLS policies on all tables
- ✅ Authenticated uploads only
- ✅ Service role for AI analysis
- ✅ Secure API key storage
- ✅ Public photo URLs (optional)

### Performance

- **Upload**: <2 seconds
- **AI Analysis**: 3-5 seconds
- **Total**: ~5-7 seconds per cake

### Limitations

1. AI accuracy depends on photo quality
2. Unusual fonts may be misread
3. Very decorative writing challenging
4. Requires clear, well-lit photos
5. API rate limits apply

### Roadmap

Future enhancements:

- [ ] Custom AI training on your cakes
- [ ] Multi-angle photo analysis
- [ ] Color matching verification
- [ ] Decoration pattern matching
- [ ] Video analysis support
- [ ] Mobile app for uploads
- [ ] Automated notifications
- [ ] Analytics dashboard

### Support

Common issues:
- Check API keys are set
- Verify storage bucket exists
- Ensure RLS policies correct
- Review Edge Function logs

### Examples

See `examples/` directory for:
- Complete integration examples
- Custom training data
- Batch processing scripts
- Dashboard analytics

### License

MIT - Use freely in your bakery! 🎂
