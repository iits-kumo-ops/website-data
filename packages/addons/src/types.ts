/**
 * Type definitions for KumoOps Addons data
 */

export type Locale = "en" | "de" | "fr" | "es" | "it" | "nl" | "da" | "sv";

export const SUPPORTED_LOCALES: Locale[] = [
  "en",
  "de",
  "fr",
  "es",
  "it",
  "nl",
  "da",
  "sv",
];

export interface Addon {
  label: string;
  pricing: string;
  short_description: string;
  detailed_description: string;
}

export interface Category {
  label: string;
  items: Record<string, Addon>;
}

export interface AddonsData {
  meta: {
    version: string;
    lastUpdated: string;
    description: string;
  };
  categories: Record<string, Category>;
}

export type CategoryId =
  | "recommended"
  | "support_operations"
  | "security"
  | "artificial_intelligence"
  | "cloud_specific";

export type AddonId =
  // Recommended
  | "migration"
  | "capacity_boost"
  | "upgrade_support"
  | "managed_databases"
  | "git_hosting"
  | "argocd_project_mgmt"
  | "cloud_cost_optimization"
  | "message_broker"
  | "additional_stage"
  // Support & Operations
  | "flex_tm_support_weekend"
  | "flex_tm_support"
  | "premium_sla_global"
  | "premium_sla_eu"
  // Security
  | "vpn_ipsec"
  | "container_image_hardening"
  | "proactive_patch_mgmt"
  | "passive_patch_mgmt"
  | "managed_container_registry"
  | "waf_management"
  | "multi_tenancy"
  | "psa_compatibility"
  | "psa_itil_support"
  | "c5_testified"
  // AI
  | "managed_azure_openai"
  | "homeport_ai"
  // Cloud Specific
  | "rbac_telekom"
  | "managed_identities"
  | "rbac_azure";
