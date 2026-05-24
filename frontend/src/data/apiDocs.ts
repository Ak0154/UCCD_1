export interface Parameter {
  name: string
  type: string
  required: boolean
  description: string
}

export interface ErrorResponse {
  code: number
  description: string
  response: string
}

export interface Endpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'WS'
  path: string
  description: string
  authRequired: boolean
  implemented: boolean
  group: string
  pathParameters?: Parameter[]
  queryParameters?: Parameter[]
  requestBody?: string
  response200: string
  errorResponses?: ErrorResponse[]
}
export const endpointsData: Endpoint[] = [
  // Section 1: Authentication
  {
    id: "post_auth_login",
    method: "POST",
    path: "/auth/login",
    description: "Authenticate an API client or agent and receive an access token.",
    authRequired: false,
    implemented: true,
    group: "Authentication",
    requestBody: `{
  "client_id": "omni_client_abc123",
  "client_secret": "sk_live_9876543210qwertyuiop"
}`,
    response200: `{
  "access_token": "omni_token_a1b2c3d4e5f6g7h8i9j0",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read_write_complaints",
  "created_at": "2026-05-22T17:10:35Z"
}`,
    errorResponses: [
      {
        code: 400,
        description: "Bad Request - Invalid credentials payload formatting",
        response: `{
  "error": "bad_request",
  "message": "The fields 'client_id' and 'client_secret' must be provided in valid string format."
}`
      },
      {
        code: 401,
        description: "Unauthorized - Client ID or Secret mismatch",
        response: `{
  "error": "invalid_client",
  "error_description": "The client identifier or client secret is incorrect."
}`
      }
    ]
  },

  // Section 2: Complaints
  {
    id: "post_complaints",
    method: "POST",
    path: "/complaints",
    description: "Create a new customer complaint or dispute ticket in the system.",
    authRequired: true,
    implemented: true,
    group: "Complaints",
    requestBody: `{
  "customer_id": "cust_8829-aa",
  "channel": "email",
  "subject": "Incomplete refund on disputed transaction",
  "priority": "high",
  "text": "My subscription was cancelled on the 1st of the month, but I was billed for the entire period. I require a partial refund of $24.99 and confirmation of contract dissolution.",
  "metadata": {
    "source_system": "salesforce",
    "account_tier": "enterprise"
  }
}`,
    response200: `{
  "id": "comp_abc8829",
  "customer_id": "cust_8829-aa",
  "channel": "email",
  "subject": "Incomplete refund on disputed transaction",
  "priority": "high",
  "status": "open",
  "sla_status": "active",
  "escalated": false,
  "created_at": "2026-05-22T17:10:35Z",
  "assigned_agent_id": "agent_unassigned"
}`,
    errorResponses: [
      {
        code: 400,
        description: "Bad Request - Missing or Invalid parameters",
        response: `{
  "error": "bad_request",
  "message": "The field 'channel' must be one of: email, chat, phone, web."
}`
      },
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 422,
        description: "Unprocessable Entity - Duplicate dispute conflict",
        response: `{
  "error": "unprocessable_entity",
  "message": "A complaint with the exact customer ID and subject was dispatched within the last 10 minutes."
}`
      }
    ]
  },
  {
    id: "get_complaints",
    method: "GET",
    path: "/complaints",
    description: "Retrieve a paginated, filterable list of complaint tickets.",
    authRequired: true,
    implemented: true,
    group: "Complaints",
    queryParameters: [
      {
        name: "limit",
        type: "integer",
        required: false,
        description: "The number of tickets to return (1-100). Default is 10."
      },
      {
        name: "status",
        type: "string",
        required: false,
        description: "Filter complaints by state: open, in_progress, resolved, closed."
      },
      {
        name: "priority",
        type: "string",
        required: false,
        description: "Filter by priority level: low, medium, high, critical."
      }
    ],
    response200: `{
  "complaints": [
    {
      "id": "comp_abc8829",
      "status": "open",
      "channel": "email",
      "priority": "high",
      "subject": "Incomplete refund on disputed transaction",
      "created_at": "2026-05-22T17:10:35Z"
    },
    {
      "id": "comp_def1120",
      "status": "in_progress",
      "channel": "chat",
      "priority": "medium",
      "subject": "Delayed onboarding follow-up",
      "created_at": "2026-05-22T15:20:00Z"
    }
  ],
  "has_more": false,
  "total_count": 2,
  "page": 1
}`,
    errorResponses: [
      {
        code: 400,
        description: "Bad Request - Malformed query criteria formatting",
        response: `{
  "error": "bad_request",
  "message": "The 'limit' parameter must be a valid positive integer."
}`
      },
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      }
    ]
  },
  {
    id: "get_complaints_id",
    method: "GET",
    path: "/complaints/{id}",
    description: "Retrieve complete metadata and activity payload of a single complaint ticket by ID.",
    authRequired: true,
    implemented: true,
    group: "Complaints",
    pathParameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "The unique identifier of the complaint record to inspect."
      }
    ],
    response200: `{
  "id": "comp_abc8829",
  "customer_id": "cust_8829-aa",
  "channel": "email",
  "subject": "Incomplete refund on disputed transaction",
  "priority": "high",
  "text": "My subscription was cancelled on the 1st of the month, but I was billed for the entire period. I require a partial refund of $24.99 and confirmation of contract dissolution.",
  "status": "open",
  "assigned_agent_id": "agent_unassigned",
  "created_at": "2026-05-22T17:10:35Z",
  "sla_due_at": "2026-05-23T17:10:35Z"
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 404,
        description: "Not Found - Complaint record not found",
        response: `{
  "error": "not_found",
  "message": "No complaint was found corresponding to ID: comp_invalid_id."
}`
      }
    ]
  },
  {
    id: "put_complaints_id_status",
    method: "PUT",
    path: "/complaints/{id}/status",
    description: "Transition the state of a specific complaint case.",
    authRequired: true,
    implemented: true,
    group: "Complaints",
    pathParameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "The unique identifier of the target complaint."
      }
    ],
    requestBody: `{
  "status": "resolved",
  "resolution_notes": "Initiated automated stripe refund reversal mechanism for $24.99."
}`,
    response200: `{
  "id": "comp_abc8829",
  "previous_status": "open",
  "current_status": "resolved",
  "resolution_notes": "Initiated automated stripe refund reversal mechanism for $24.99.",
  "updated_at": "2026-05-22T17:12:44Z"
}`,
    errorResponses: [
      {
        code: 400,
        description: "Bad Request - Invalid state transition requested",
        response: `{
  "error": "bad_request",
  "message": "Cannot transition complaints directly from 'closed' back to 'resolved' without prior state checks."
}`
      },
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 404,
        description: "Not Found - Complaint record not found",
        response: `{
  "error": "not_found",
  "message": "No complaint was found corresponding to ID: comp_invalid_id."
}`
      }
    ]
  },
  {
    id: "get_complaints_id_sla",
    method: "GET",
    path: "/complaints/{id}/sla",
    description: "Fetch SLA parameters, elapsed indicators, and breach estimations of a complaint.",
    authRequired: true,
    implemented: true,
    group: "Complaints",
    pathParameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "The unique identifier of the target complaint."
      }
    ],
    response200: `{
  "id": "comp_abc8829",
  "sla_limit_hours": 24,
  "elapsed_hours": 1.25,
  "remaining_seconds": 81900,
  "status": "compliant",
  "breach_probability": 0.04
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 404,
        description: "Not Found - Complaint record not found",
        response: `{
  "error": "not_found",
  "message": "No SLA data available because complaint with given identifier was not found."
}`
      }
    ]
  },
  {
    id: "get_complaints_id_draft",
    method: "GET",
    path: "/complaints/{id}/draft",
    description: "Synthesize an AI-generated draft response aligned to the customer's query context.",
    authRequired: true,
    implemented: true,
    group: "Complaints",
    pathParameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "The unique complaint record to inspect."
      }
    ],
    response200: `{
  "id": "draft_7a6c",
  "complaint_id": "comp_abc8829",
  "generated_by": "omni_resol_ai_v2",
  "draft_text": "Dear customer,\\n\\nWe apologize sincerely for the contract cancellation dispute. Upon review, we have verified that a refund of $24.99 was indeed not automatically generated. Our finance systems have corrected this anomaly and a reversal back to card ending in 4242 is now active.\\n\\nWarm regards,\\nOmniResol Agent",
  "confidence_score": 0.982,
  "model_version": "gemini-1.5-pro-002"
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 404,
        description: "Not Found - Complaint record not found",
        response: `{
  "error": "not_found",
  "message": "Cannot synthesize AI drafts. Complaint record not found for lookup ID."
}`
      },
      {
        code: 429,
        description: "Too Many Requests - AI generation rate limits",
        response: `{
  "error": "rate_limited",
  "message": "Gemini batch throughput quotas exceeded. Please retry in 60 seconds."
}`
      }
    ]
  },
  {
    id: "post_complaints_id_respond",
    method: "POST",
    path: "/complaints/{id}/respond",
    description: "Commit the final message directly to the customer through the active notification pipeline.",
    authRequired: true,
    implemented: true,
    group: "Complaints",
    pathParameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "The target complaint identifier."
      }
    ],
    requestBody: `{
  "response_text": "Dear customer, we have reversed the double billing charge on your account.",
  "send_immediately": true
}`,
    response200: `{
  "id": "comp_abc8829",
  "success": true,
  "status": "dispatched",
  "message_id": "msg_003847",
  "channel": "email",
  "recipient": "cust_8829-aa",
  "dispatched_at": "2026-05-22T17:15:00Z"
}`,
    errorResponses: [
      {
        code: 400,
        description: "Bad Request - Empty message or malformed request payload",
        response: `{
  "error": "bad_request",
  "message": "The field 'response_text' must be non-empty and limited to 4000 characters."
}`
      },
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 404,
        description: "Not Found - Complaint record not found",
        response: `{
  "error": "not_found",
  "message": "Unable to dispatch message payload. Complaint record not found."
}`
      }
    ]
  },
  {
    id: "get_complaints_id_history",
    method: "GET",
    path: "/complaints/{id}/history",
    description: "Retrieve historical system and human transitions mapping of a complaint ticket.",
    authRequired: true,
    implemented: true,
    group: "Complaints",
    pathParameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "The target complaint identifier."
      }
    ],
    response200: `{
  "id": "comp_abc8829",
  "events": [
    {
      "timestamp": "2026-05-22T17:10:35Z",
      "action": "created",
      "actor": "customer",
      "details": "Complaint created from email pipeline."
    },
    {
      "timestamp": "2026-05-22T17:11:15Z",
      "action": "ai_draft_generated",
      "actor": "system",
      "details": "AI response generated with high confidence."
    },
    {
      "timestamp": "2026-05-22T17:14:02Z",
      "action": "viewed_by_agent",
      "actor": "agent_332",
      "details": "Agent inspected SLA status requirements."
    }
  ]
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 404,
        description: "Not Found - Complaint record not found",
        response: `{
  "error": "not_found",
  "message": "History can only be fetched for active complaints. Id not found."
}`
      }
    ]
  },
  {
    id: "get_complaints_escalations",
    method: "GET",
    path: "/complaints/escalations",
    description: "Retrieve a summary of critical high-risk tickets awaiting manual manager attention.",
    authRequired: true,
    implemented: true,
    group: "Complaints",
    response200: `{
  "escalation_count": 1,
  "escalations": [
    {
      "id": "comp_abc8829",
      "escalation_reason": "SLA warning within 1 hour threshold limit",
      "severity": "critical",
      "flagged_at": "2026-05-22T17:10:35Z"
    }
  ]
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      }
    ]
  },

  // Section 3: Dashboard & Analytics
  {
    id: "get_dashboard_kpis",
    method: "GET",
    path: "/dashboard/kpis",
    description: "Obtain structural resolution KPIs and operational load integers.",
    authRequired: true,
    implemented: true,
    group: "Dashboard & Analytics",
    response200: `{
  "active_cases": 142,
  "average_resolution_time_hours": 3.42,
  "sla_breach_rate": 0.015,
  "unassigned_disputes": 18,
  "last_updated": "2026-05-22T17:10:35Z"
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 403,
        description: "Forbidden - Administrator scope required",
        response: `{
  "error": "forbidden",
  "message": "The active credentials do not possess analytical supervisor reading scopes."
}`
      }
    ]
  },
  {
    id: "get_analytics_trends",
    method: "GET",
    path: "/analytics/trends",
    description: "Aquire historical day-over-day statistical aggregate data.",
    authRequired: true,
    implemented: true,
    group: "Dashboard & Analytics",
    queryParameters: [
      {
        name: "days",
        type: "integer",
        required: false,
        description: "The historical window scale (1-90). Default is 30."
      }
    ],
    response200: `{
  "window_days": 30,
  "trends": [
    {
      "date": "2026-05-21",
      "volume_created": 320,
      "volume_resolved": 312,
      "mean_response_delay_sec": 382
    },
    {
      "date": "2026-05-22",
      "volume_created": 145,
      "volume_resolved": 139,
      "mean_response_delay_sec": 298
    }
  ]
}`,
    errorResponses: [
      {
        code: 400,
        description: "Bad Request - Invalid days query limit",
        response: `{
  "error": "bad_request",
  "message": "Scope of historical analysis days must reside between 1 and 90."
}`
      },
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      }
    ]
  },

  // Section 4: Agents & Simulation
  {
    id: "get_agents_load",
    method: "GET",
    path: "/agents/load",
    description: "Monitor simulated virtual bot workers currently handling complaints.",
    authRequired: true,
    implemented: true,
    group: "Agents & Simulation",
    response200: `{
  "agents": [
    {
      "name": "BillingAgent-1",
      "active_jobs": 4,
      "queue_depth": 12,
      "uptime_percent": 99.8,
      "status": "healthy"
    },
    {
      "name": "PolicyAgent-3",
      "active_jobs": 1,
      "queue_depth": 1,
      "uptime_percent": 100.0,
      "status": "healthy"
    }
  ]
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      }
    ]
  },
  {
    id: "post_simulation_run",
    method: "POST",
    path: "/simulation/run",
    description: "Launch synthetic workloads to benchmark dispute resolver performance metrics.",
    authRequired: true,
    implemented: true,
    group: "Agents & Simulation",
    requestBody: `{
  "duration_seconds": 60,
  "intensity_multiplier": 2.5,
  "channel_mix": [
    "email",
    "chat"
  ]
}`,
    response200: `{
  "simulation_id": "sim_3a2b8e9f",
  "status": "running",
  "spawned_rate_per_sec": 4.5,
  "active_workers_assigned": 8,
  "estimated_completion": "2026-05-22T17:11:35Z"
}`,
    errorResponses: [
      {
        code: 400,
        description: "Bad Request - Invalid intensity multipliers",
        response: `{
  "error": "bad_request",
  "message": "Duration seconds must operate between 10 and 600. Multipliers must reside under 5.0."
}`
      },
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      }
    ]
  },

  // Section 5: AI Helpers
  {
    id: "get_ai_translate_preview",
    method: "GET",
    path: "/ai/translate-preview",
    description: "Audit raw text automatic machine transformations prior to sending dispatch.",
    authRequired: true,
    implemented: true,
    group: "AI Helpers",
    queryParameters: [
      {
        name: "target_lang",
        type: "string",
        required: true,
        description: "The desired output language ISO-639 string. Example: 'es'."
      },
      {
        name: "text",
        type: "string",
        required: true,
        description: "The original english source text segment."
      }
    ],
    response200: `{
  "target_lang": "es",
  "source_lang": "en",
  "original_text": "I was double billed",
  "translated_text": "Se me cobró dos veces",
  "confidence_score": 0.994
}`,
    errorResponses: [
      {
        code: 400,
        description: "Bad Request - Missing query arguments text or lang",
        response: `{
  "error": "bad_request",
  "message": "Both query parameters 'target_lang' and 'text' are required for translation audits."
}`
      },
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      }
    ]
  },

  // Section 6: WebSocket
  {
    id: "ws_ws_supervisor",
    method: "WS",
    path: "/ws/supervisor",
    description: "Establish client-side streaming synchronization of real-time supervisor supervisor events.",
    authRequired: true,
    implemented: true,
    group: "WebSocket",
    response200: `{
  "event": "alert",
  "channel": "websocket_event_supervisor",
  "timestamp": "2026-05-22T17:10:35Z",
  "data": {
    "complaint_id": "comp_abc8829",
    "message": "High priority complaint comp_9920 received - channel: email",
    "threshold_triggered": "SLA_BREACH_WARNING"
  }
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized connection attempt",
        response: `{
  "error": "websocket_unauthorized",
  "message": "Missing credentials inside connection protocol query header tokens."
}`
      }
    ]
  },
  {
    id: "get_api_health",
    method: "GET",
    path: "/api/health",
    description: "Acquire systematic server up-time and functional network state measurements.",
    authRequired: false,
    implemented: true,
    group: "WebSocket",
    response200: `{
  "status": "healthy",
  "service": "omni-resol-api",
  "version": "1.0.0",
  "uptime_seconds": 431022,
  "dependencies": {
    "database": "active_connected",
    "cache_redis": "ok",
    "ai_inference_cluster": "nominal_latency_82ms"
  }
}`,
    errorResponses: [
      {
        code: 503,
        description: "Service Unavailable - Internal database cluster outage",
        response: `{
  "error": "service_unavailable",
  "message": "Critical persistent storage clusters fail diagnostic heartbeat evaluations."
}`
      }
    ]
  },

  // Section 7: Not Implemented (Amber warnings)
  {
    id: "get_regulatory_id_status",
    method: "GET",
    path: "/regulatory/{id}/status",
    description: "View compliance logs generated by statutory state authority boards.",
    authRequired: true,
    implemented: false,
    group: "⚠ Not Implemented",
    pathParameters: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "State authority unique identification reference string."
      }
    ],
    response200: `{
  "regulatory_ref_id": "reg_va_80",
  "status": "pending_submission",
  "statutory_deadline": "2026-06-30",
  "required_filings": ["Virginia Consumer Complaint Disclosure Standard FORM V-12"]
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 501,
        description: "Not Implemented - Under active draft formulation design",
        response: `{
  "error": "not_implemented",
  "message": "This endpoint is planned under Section 7 schema but not currently deployed on active gateway clusters."
}`
      }
    ]
  },
  {
    id: "get_escalations",
    method: "GET",
    path: "/escalations",
    description: "Acquire statutory corporate legal threat escalation matrices.",
    authRequired: true,
    implemented: false,
    group: "⚠ Not Implemented",
    response200: `{
  "regulatory_escalation_records": [],
  "count": 0,
  "not_implemented_mock": "This schema is draft and pending core deployment."
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 501,
        description: "Not Implemented - Under active draft validation design",
        response: `{
  "error": "not_implemented",
  "message": "This endpoint is planned under Section 7 schema but not currently deployed on active gateway clusters."
}`
      }
    ]
  },
  {
    id: "get_kpis",
    method: "GET",
    path: "/kpis",
    description: "Detailed system health financial metric measurements.",
    authRequired: true,
    implemented: false,
    group: "⚠ Not Implemented",
    response200: `{
  "internal_financial_kpis": {},
  "sla_loss_estimates": 0.0,
  "not_implemented_mock": "Draft contract schemas representing compliance KPIs."
}`,
    errorResponses: [
      {
        code: 401,
        description: "Unauthorized - Access token is missing or invalid",
        response: `{
  "error": "unauthorized",
  "message": "Missing, invalid or expired Bearer Token."
}`
      },
      {
        code: 501,
        description: "Not Implemented - Under active draft validation design",
        response: `{
  "error": "not_implemented",
  "message": "This endpoint is planned under Section 7 schema but not currently deployed on active gateway clusters."
}`
      }
    ]
  }
];