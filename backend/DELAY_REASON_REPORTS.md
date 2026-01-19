# Delay Reason Reports Documentation

## Overview

These AI-ready delay reason reports provide comprehensive insights into task delays categorized by their root causes. All reports follow the standardized AI-ready format with metadata, filters, periods, attention items, and summary statistics.

---

## Reports Available

### 1. **Delays by Reason** (`delaysByReason`)

**Purpose**: Breakdown of all delayed tasks grouped by their delay reasons.

**Chart Type**: Bar chart

**Key Metrics**:

- Task count per reason
- Average delay days
- Total delay days
- Max/Min delay days

**Query Parameters**:

- `filter` (optional): Date range, users, projects, epics filters
- `id` (optional): Specific user ID for filtered results

**Response Structure**:

```json
{
    "chart_data": [
        {
            "id": 1,
            "name": "Resource Unavailable",
            "code": "RES_UNAVAIL",
            "category": "Resource",
            "impact_level": "high",
            "severity": "critical",
            "task_count": 12,
            "avg_delay_days": 5.5,
            "total_delay_days": 66,
            "max_delay_days": 15,
            "min_delay_days": 1
        }
    ],
    "summary_stats": {
        "total_delayed_tasks": 45,
        "total_delay_days": 210.5,
        "average_delay_days": 4.67,
        "reasons_count": 8
    },
    "period": { "from": "2026-01-01", "to": "2026-01-19" },
    "filters_applied": {
        /* ... */
    },
    "summary": {
        /* ... */
    },
    "attention_items": []
}
```

**AI Integration**:

- Identifies most common delay reasons
- Highlights systematic bottlenecks
- Enables root cause analysis for task delays

---

### 2. **Delay Reasons Impact Analysis** (`delayReasonsImpactAnalysis`)

**Purpose**: Detailed impact assessment grouped by severity and impact level.

**Chart Type**: Multi-level breakdown

**Key Metrics**:

- By Severity (critical, high, medium, low)
- By Impact Level (high, medium, low)
- Composite impact scores
- Affected tasks and total impact days

**Response Structure**:

```json
{
    "by_severity": {
        "critical": {
            "count": 2,
            "total_tasks": 15,
            "total_impact_days": 120,
            "reasons": [
                /* ... */
            ]
        },
        "high": {
            /* ... */
        }
    },
    "by_impact_level": {
        "high": {
            /* ... */
        },
        "medium": {
            /* ... */
        },
        "low": {
            /* ... */
        }
    },
    "impact_scores": [
        {
            "id": 1,
            "name": "Resource Unavailable",
            "affected_tasks": 12,
            "total_impact_days": 66,
            "impact_score": 180.0
        }
    ],
    "summary_stats": {
        "total_delayed_tasks": 45,
        "total_delay_days": 210.5,
        "unique_reasons": 8,
        "critical_reasons": 2,
        "high_impact_reasons": 3
    }
}
```

**AI Integration**:

- Prioritizes issues by composite impact score
- Enables risk assessment and mitigation planning
- Identifies cascading delay factors

---

### 3. **Delay Reasons Trend** (`delayReasonsTrend`)

**Purpose**: Trending of delay reasons over time (last 6 months by default).

**Chart Type**: Multi-line chart (one line per top reason)

**Key Metrics**:

- Monthly trend of each reason
- Task count per period
- Cumulative delay days per period
- Top 10 reasons tracked

**Response Structure**:

```json
{
    "chart_data": [
        {
            "name": "Resource Unavailable",
            "data": [
                {
                    "period": "2025-07-01",
                    "count": 2,
                    "delay_days": 10
                },
                {
                    "period": "2025-08-01",
                    "count": 3,
                    "delay_days": 15
                }
            ]
        }
    ],
    "summary_stats": {
        "period_total_tasks": 45,
        "period_total_delay_days": 210.5,
        "tracked_reasons": 8
    },
    "period": {
        "from": "2025-07-19",
        "to": "2026-01-19"
    },
    "aggregation": "month",
    "is_rolling": true
}
```

**AI Integration**:

- Detects emerging delay patterns
- Identifies seasonal or cyclical issues
- Tracks effectiveness of corrective actions

---

### 4. **Delay Reasons Distribution** (`delayReasonsDistribution`)

**Purpose**: Pie/donut chart showing distribution by reason category.

**Chart Type**: Pie/Donut chart

**Key Metrics**:

- Task count per category
- Total delay days per category
- Percentage of all delays
- Average delay days per category

**Response Structure**:

```json
{
    "chart_data": [
        {
            "category": "Resource",
            "task_count": 20,
            "total_delay_days": 110.5,
            "avg_delay_days": 5.5,
            "percentage": 44.44
        },
        {
            "category": "Dependency",
            "task_count": 15,
            "total_delay_days": 75.0,
            "avg_delay_days": 5.0,
            "percentage": 33.33
        }
    ],
    "summary_stats": {
        "total_delayed_tasks": 45,
        "total_delay_days": 210.5,
        "categories_count": 5,
        "average_delay_days": 4.67
    }
}
```

**AI Integration**:

- Quick category-level insights
- Supports high-level decision making
- Helps prioritize resolution strategies

---

### 5. **Top Delay Reasons Comparison** (`topDelayReasonsComparison`)

**Purpose**: Detailed comparison of top 10 delay reasons with composite scoring.

**Chart Type**: Data table with composite rankings

**Key Metrics**:

- Composite priority score (frequency × severity × impact)
- Affected projects and users
- Statistical distribution (avg, max, min)
- Description and metadata

**Response Structure**:

```json
{
    "chart_data": [
        {
            "id": 1,
            "name": "Resource Unavailable",
            "code": "RES_UNAVAIL",
            "category": "Resource",
            "severity": "critical",
            "impact_level": "high",
            "description": "Required resources were not available",
            "task_count": 12,
            "affected_projects": 5,
            "affected_users": 8,
            "total_delay_days": 66.0,
            "avg_delay_days": 5.5,
            "max_delay_days": 15.0,
            "min_delay_days": 1.0,
            "composite_priority_score": 18.9
        }
    ],
    "summary_stats": {
        "total_delayed_tasks": 45,
        "total_delay_days": 210.5,
        "top_reasons_shown": 10,
        "avg_delay_days": 4.67
    }
}
```

**AI Integration**:

- Holistic ranking considering multiple factors
- Enables data-driven prioritization
- Supports automated alert and escalation rules

---

## AI-Ready Metadata Included

All reports include standardized metadata for AI consumption:

### 1. **Period Information**

```json
"period": {
  "from": "2026-01-01",
  "to": "2026-01-19"
}
```

- Enables temporal context for AI reasoning
- Supports time-aware analysis and recommendations

### 2. **Comparison Period** (when applicable)

```json
"comparison_period": {
  "from": "2025-12-13",
  "to": "2025-12-31"
}
```

- Enables trend detection
- Supports YoY and period-over-period analysis

### 3. **Filters Applied**

```json
"filters_applied": {
  "date_range_provided": true,
  "projects": [1, 2, 3],
  "users": [5, 10],
  "epics": []
}
```

- Ensures AI understands data scope
- Prevents misinterpretation of results

### 4. **Summary Block**

```json
"summary": {
  "current_value": 45,
  "previous_value": 52,
  "difference": -7,
  "percentage_change": -13.46,
  "percentage_change_reason": "comparison_period_computed",
  "unit": "count",
  "is_comparable": true
}
```

- Provides quick statistical overview
- Enables AI-driven anomaly detection

### 5. **Attention Items**

Dynamic rules-based alerts for AI:

```json
"attention_items": [
  {
    "type": "high_impact",
    "rule_name": "Critical Severity Reason Detected",
    "data_element": "Resource Unavailable",
    "metric": "12 tasks affected",
    "recommendation": "Prioritize resource allocation review"
  },
  {
    "type": "trend_alert",
    "rule_name": "Increasing Delays",
    "data_element": "Dependency",
    "metric": "+30% month-over-month",
    "recommendation": "Investigate dependency management process"
  }
]
```

### 6. **Counts Block**

```json
"counts": {
  "records": 8,
  "records_type": "delay_reasons"
}
```

---

## API Endpoints

### Dashboard Endpoint (All Reports)

```
GET /api/v1/dashboard-reports
```

Query Parameters:

- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)
- `users`: Comma-separated user IDs
- `projects`: Comma-separated project IDs
- `epics`: Comma-separated epic IDs

Response includes all 5 delay reason reports plus existing reports.

### Individual Report Endpoints (to be created)

```
GET /api/v1/reports/delays-by-reason?from=2026-01-01&to=2026-01-19
GET /api/v1/reports/delay-reasons-impact-analysis
GET /api/v1/reports/delay-reasons-trend
GET /api/v1/reports/delay-reasons-distribution
GET /api/v1/reports/top-delay-reasons-comparison
```

---

## AI Integration Examples

### Example 1: Root Cause Analysis

```
AI Query: "What are the top 3 reasons causing delays?"
Data Source: topDelayReasonsComparison + impact_scores
AI Output: Identifies highest composite_priority_score reasons with descriptions
```

### Example 2: Trend Detection

```
AI Query: "Are delays getting worse?"
Data Source: delayReasonsTrend + comparison_period
AI Output: Compares current period to previous, identifies emerging patterns
```

### Example 3: Impact Assessment

```
AI Query: "Which delay reason needs immediate attention?"
Data Source: delayReasonsImpactAnalysis + attention_items
AI Output: Prioritizes by severity + impact_level + affected_scope
```

### Example 4: Categorical Insights

```
AI Query: "Where are most delays coming from?"
Data Source: delayReasonsDistribution
AI Output: Category breakdown with percentages and trends
```

---

## Filter Support

All reports support consistent filtering:

| Filter     | Type    | Example    |
| ---------- | ------- | ---------- |
| `from`     | Date    | 2026-01-01 |
| `to`       | Date    | 2026-01-19 |
| `users`    | CSV IDs | 5,10,15    |
| `projects` | CSV IDs | 1,2,3      |
| `epics`    | CSV IDs | 1,2        |

---

## Performance Considerations

- Reports use aggregate queries to minimize database load
- Time-series data grouped by month for trending
- Top 10 reasons limited in trend report for clarity
- All queries honor organization_id for multi-tenancy

---

## Future Enhancements

1. **Predictive Analytics**: ML-based prediction of likely delay reasons
2. **Remediation Tracking**: Link reasons to mitigation actions
3. **Team Performance**: Delay reasons by team/department
4. **Dependency Analysis**: Cross-project delay reason correlations
5. **Automated Escalation**: Rules-based escalation when thresholds exceeded
