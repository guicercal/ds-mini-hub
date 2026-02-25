import { Client } from '@hubspot/api-client'

/**
 * Global instance of the HubSpot API Client.
 * 
 * If the HUBSPOT_ACCESS_TOKEN environment variable is not set, 
 * this exports null to signify fallback handling should be used downstream.
 */
export const hubspotClient = process.env.HUBSPOT_ACCESS_TOKEN
    ? new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN })
    : null
