# AI Assessment Service Integration

This document explains how the AI service can access and update standardized assessment results for students based on individual observations.

## Database Structure

Three tables have been created to store standardized assessment results:

### 1. Life Skills Assessments

- **Table**: `life_skills_assessments`
- **Scoring Range**: 1-5 for all metrics
- **Metrics**:
  - Self-awareness (self_awareness_score)
  - Empathy (empathy_score)
  - Friendship and healthy relationships (friendship_and_healthy_relationships_score)
  - Effective communication (effective_communication_score)
  - Creative thinking (creative_thinking_score)
  - Problem solving (problem_solving_score)
  - Decision making (decision_making_score)
  - Critical thinking (critical_thinking_score)
  - Emotion management (emotion_management_score)
  - Self-confidence (self_confidence_score)

### 2. Active Life Standardization

- **Table**: `active_life_assessments`
- **Scoring Range**: 0-3 for all metrics
- **Metrics**:
  - Belief, religious, ethical (belief_religious_ethical_score)
  - Social, political (social_political_score)
  - Biological, physical (biological_physical_score)
  - Aesthetic, artistic (aesthetic_artistic_score)
  - Economic, professional (economic_professional_score)
  - Scientific, technological (scientific_technological_score)

### 3. Growth and Development

- **Table**: `growth_development_assessments`
- **Scoring Range**: 1-5 for all metrics
- **Metrics**:
  - Linguistic-verbal (linguistic_verbal_score)
  - Logical-mathematical (logical_mathematical_score)
  - Visual-spatial (visual_spatial_score)
  - Musical (musical_score)
  - Existential (existential_score)
  - Bodily-kinesthetic (bodily_kinesthetic_score)
  - Interpersonal (interpersonal_score)
  - Intrapersonal (intrapersonal_score)
  - Naturalistic (naturalistic_score)
  - Moral-spiritual (moral_spiritual_score)

## API Endpoints

### Retrieving Assessment Results

**Endpoint**: `GET /api/ai/assessment-results`
**Query Parameters**:

- `studentId` (required): Student's national ID
- `subjectId` (required): Subject UUID
- `classId` (required): Class UUID

**Response**:

```json
{
  "success": true,
  "data": {
    "lifeSkills": [...],
    "activeLife": [...],
    "growthDevelopment": [...]
  }
}
```

### Creating/Updating Assessment Results

**Endpoint**: `POST /api/ai/assessment-results`
**Request Body**:

```json
{
  "studentId": "string",
  "classId": "UUID",
  "subjectId": "UUID",
  "teacherId": "UUID",
  "assessmentDate": "YYYY-MM-DD",
  "type": "life_skills|active_life|growth_development",
  "results": {
    // Type-specific metrics
  }
}
```

## AI Service Integration Workflow

1. **Data Collection**: AI service retrieves individual observations from existing teacher reports
2. **Analysis**: AI analyzes observations to generate standardized assessment scores
3. **Storage**: AI service stores results via the POST endpoint
4. **Retrieval**: Frontend or other services can retrieve results via the GET endpoint

## Authentication

The API endpoints currently do not implement specific AI service authentication. In a production environment, this should be added to ensure only authorized AI services can access and modify assessment data.

## Example Usage

### Retrieving Student Assessment Data

```bash
curl "http://localhost:3000/api/ai/assessment-results?studentId=1234567890&subjectId=uuid123&classId=uuid456"
```

### Submitting Assessment Results

```bash
curl -X POST http://localhost:3000/api/ai/assessment-results \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "1234567890",
    "classId": "class-uuid",
    "subjectId": "subject-uuid",
    "teacherId": "teacher-uuid",
    "assessmentDate": "2023-12-01",
    "type": "life_skills",
    "results": {
      "selfAwarenessScore": 4,
      "empathyScore": 5,
      "friendshipAndHealthyRelationshipsScore": 3,
      // ... other metrics
    }
  }'
```
