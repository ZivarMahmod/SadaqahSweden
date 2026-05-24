export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_daglig_sammanfattning_state: {
        Row: {
          admin_id: string
          created_at: string
          kanal_epost: boolean
          kanal_inapp: boolean
          senaste_skickad: string | null
          tid_utskick: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          kanal_epost?: boolean
          kanal_inapp?: boolean
          senaste_skickad?: string | null
          tid_utskick?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          kanal_epost?: boolean
          kanal_inapp?: boolean
          senaste_skickad?: string | null
          tid_utskick?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_daglig_sammanfattning_state_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_daglig_sammanfattning_state_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_ingreppslogg: {
        Row: {
          admin_id: string | null
          created_at: string
          detaljer: Json
          id: string
          ingrepp_typ: Database["public"]["Enums"]["admin_ingrepp_typ"]
          mal_donation_id: string | null
          mal_event_id: string | null
          mal_insamling_id: string | null
          mal_kommentar_id: string | null
          motivering: string
          reversibel: boolean
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          detaljer?: Json
          id?: string
          ingrepp_typ: Database["public"]["Enums"]["admin_ingrepp_typ"]
          mal_donation_id?: string | null
          mal_event_id?: string | null
          mal_insamling_id?: string | null
          mal_kommentar_id?: string | null
          motivering: string
          reversibel?: boolean
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          detaljer?: Json
          id?: string
          ingrepp_typ?: Database["public"]["Enums"]["admin_ingrepp_typ"]
          mal_donation_id?: string | null
          mal_event_id?: string | null
          mal_insamling_id?: string | null
          mal_kommentar_id?: string | null
          motivering?: string
          reversibel?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "admin_ingreppslogg_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_ingreppslogg_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_ingreppslogg_mal_donation_id_fkey"
            columns: ["mal_donation_id"]
            isOneToOne: false
            referencedRelation: "donation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_ingreppslogg_mal_event_id_fkey"
            columns: ["mal_event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_ingreppslogg_mal_insamling_id_fkey"
            columns: ["mal_insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_ingreppslogg_mal_kommentar_id_fkey"
            columns: ["mal_kommentar_id"]
            isOneToOne: false
            referencedRelation: "kommentar"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_larm: {
        Row: {
          detaljer: string | null
          donation_id: string | null
          granskning_id: string | null
          hanterad_at: string | null
          hanterad_av: string | null
          id: string
          insamling_id: string | null
          kategori: Database["public"]["Enums"]["larm_kategori"]
          metadata: Json
          niva: Database["public"]["Enums"]["larm_niva"]
          rubrik: string
          status: Database["public"]["Enums"]["larm_status"]
          triggered_at: string
        }
        Insert: {
          detaljer?: string | null
          donation_id?: string | null
          granskning_id?: string | null
          hanterad_at?: string | null
          hanterad_av?: string | null
          id?: string
          insamling_id?: string | null
          kategori: Database["public"]["Enums"]["larm_kategori"]
          metadata?: Json
          niva: Database["public"]["Enums"]["larm_niva"]
          rubrik: string
          status?: Database["public"]["Enums"]["larm_status"]
          triggered_at?: string
        }
        Update: {
          detaljer?: string | null
          donation_id?: string | null
          granskning_id?: string | null
          hanterad_at?: string | null
          hanterad_av?: string | null
          id?: string
          insamling_id?: string | null
          kategori?: Database["public"]["Enums"]["larm_kategori"]
          metadata?: Json
          niva?: Database["public"]["Enums"]["larm_niva"]
          rubrik?: string
          status?: Database["public"]["Enums"]["larm_status"]
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_larm_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_larm_granskning_id_fkey"
            columns: ["granskning_id"]
            isOneToOne: false
            referencedRelation: "granskning"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_larm_hanterad_av_fkey"
            columns: ["hanterad_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_larm_hanterad_av_fkey"
            columns: ["hanterad_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_larm_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
        ]
      }
      badge: {
        Row: {
          beskrivning: string
          created_at: string
          id: string
          namn: string
          slug: string
        }
        Insert: {
          beskrivning: string
          created_at?: string
          id?: string
          namn: string
          slug: string
        }
        Update: {
          beskrivning?: string
          created_at?: string
          id?: string
          namn?: string
          slug?: string
        }
        Relationships: []
      }
      collab: {
        Row: {
          begard_at: string
          besvarad_at: string | null
          collab_typ: Database["public"]["Enums"]["collab_typ"]
          created_at: string
          id: string
          insamling_id: string
          organisation_id: string
          status: Database["public"]["Enums"]["collab_status"]
          updated_at: string
        }
        Insert: {
          begard_at?: string
          besvarad_at?: string | null
          collab_typ: Database["public"]["Enums"]["collab_typ"]
          created_at?: string
          id?: string
          insamling_id: string
          organisation_id: string
          status?: Database["public"]["Enums"]["collab_status"]
          updated_at?: string
        }
        Update: {
          begard_at?: string
          besvarad_at?: string | null
          collab_typ?: Database["public"]["Enums"]["collab_typ"]
          created_at?: string
          id?: string
          insamling_id?: string
          organisation_id?: string
          status?: Database["public"]["Enums"]["collab_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisation"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          business_type: string | null
          capabilities: Json
          charges_enabled: boolean
          country: string
          created_at: string
          details_submitted: boolean
          id: string
          payout_schedule: string
          payouts_enabled: boolean
          profile_id: string | null
          requirements: Json
          status: Database["public"]["Enums"]["connected_account_status"]
          stripe_account_id: string
          typ: Database["public"]["Enums"]["connected_account_typ"]
          updated_at: string
        }
        Insert: {
          business_type?: string | null
          capabilities?: Json
          charges_enabled?: boolean
          country?: string
          created_at?: string
          details_submitted?: boolean
          id?: string
          payout_schedule?: string
          payouts_enabled?: boolean
          profile_id?: string | null
          requirements?: Json
          status?: Database["public"]["Enums"]["connected_account_status"]
          stripe_account_id: string
          typ: Database["public"]["Enums"]["connected_account_typ"]
          updated_at?: string
        }
        Update: {
          business_type?: string | null
          capabilities?: Json
          charges_enabled?: boolean
          country?: string
          created_at?: string
          details_submitted?: boolean
          id?: string
          payout_schedule?: string
          payouts_enabled?: boolean
          profile_id?: string | null
          requirements?: Json
          status?: Database["public"]["Enums"]["connected_account_status"]
          stripe_account_id?: string
          typ?: Database["public"]["Enums"]["connected_account_typ"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connected_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          avgift_ore: number
          belopp_ore: number
          created_at: string
          currency: string
          donation_id: string
          evidence_due_by: string | null
          id: string
          insamling_id: string
          is_charge_refundable: boolean
          reason: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          stripe_dispute_id: string
          updated_at: string
        }
        Insert: {
          avgift_ore?: number
          belopp_ore: number
          created_at?: string
          currency?: string
          donation_id: string
          evidence_due_by?: string | null
          id?: string
          insamling_id: string
          is_charge_refundable?: boolean
          reason?: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          stripe_dispute_id: string
          updated_at?: string
        }
        Update: {
          avgift_ore?: number
          belopp_ore?: number
          created_at?: string
          currency?: string
          donation_id?: string
          evidence_due_by?: string | null
          id?: string
          insamling_id?: string
          is_charge_refundable?: boolean
          reason?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          stripe_dispute_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
        ]
      }
      donation: {
        Row: {
          anonym: boolean
          bekraftad: boolean
          belopp_ore: number
          created_at: string
          donator_epost: string
          donator_id: string | null
          enhet_antal: number | null
          failure_reason: string | null
          frivilligt_bidrag_ore: number
          id: string
          insamling_id: string
          public_id: string
          refunderad: boolean
          refunderad_at: string | null
          refunderad_belopp_ore: number
          status: Database["public"]["Enums"]["donation_status"]
          stripe_avgift_ore: number
          stripe_balance_transaction_id: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          transfer_id: string | null
          undermal_val: Database["public"]["Enums"]["donation_undermal_val"]
          updated_at: string
        }
        Insert: {
          anonym?: boolean
          bekraftad?: boolean
          belopp_ore: number
          created_at?: string
          donator_epost: string
          donator_id?: string | null
          enhet_antal?: number | null
          failure_reason?: string | null
          frivilligt_bidrag_ore?: number
          id?: string
          insamling_id: string
          public_id?: string
          refunderad?: boolean
          refunderad_at?: string | null
          refunderad_belopp_ore?: number
          status?: Database["public"]["Enums"]["donation_status"]
          stripe_avgift_ore?: number
          stripe_balance_transaction_id?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transfer_id?: string | null
          undermal_val?: Database["public"]["Enums"]["donation_undermal_val"]
          updated_at?: string
        }
        Update: {
          anonym?: boolean
          bekraftad?: boolean
          belopp_ore?: number
          created_at?: string
          donator_epost?: string
          donator_id?: string | null
          enhet_antal?: number | null
          failure_reason?: string | null
          frivilligt_bidrag_ore?: number
          id?: string
          insamling_id?: string
          public_id?: string
          refunderad?: boolean
          refunderad_at?: string | null
          refunderad_belopp_ore?: number
          status?: Database["public"]["Enums"]["donation_status"]
          stripe_avgift_ore?: number
          stripe_balance_transaction_id?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transfer_id?: string | null
          undermal_val?: Database["public"]["Enums"]["donation_undermal_val"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_donator_id_fkey"
            columns: ["donator_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_donator_id_fkey"
            columns: ["donator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      event: {
        Row: {
          anmalan_lank: string | null
          arrangor_org_id: string | null
          arrangor_profil_id: string | null
          beskrivning: string
          cover_path: string | null
          created_at: string
          deleted_at: string | null
          digital_lank: string | null
          godkand_av: string | null
          id: string
          insamlar_lan_kod: string | null
          installt_forekomster: string[]
          kontakt_epost: string | null
          kontakt_telefon: string | null
          kostnad: string | null
          plats_adress: string | null
          plats_lat: number | null
          plats_lng: number | null
          plats_namn: string | null
          plats_organisation_id: string | null
          plats_stad: string | null
          plats_typ: Database["public"]["Enums"]["event_plats_typ"]
          public_id: string
          publicerad_at: string | null
          slug: string
          slut_at: string | null
          start_at: string
          status: Database["public"]["Enums"]["event_status"]
          titel: string
          typ: Database["public"]["Enums"]["event_typ"]
          updated_at: string
          upprepning: Database["public"]["Enums"]["event_upprepning"] | null
          upprepning_slut: string | null
          upprepning_veckodag: number | null
        }
        Insert: {
          anmalan_lank?: string | null
          arrangor_org_id?: string | null
          arrangor_profil_id?: string | null
          beskrivning: string
          cover_path?: string | null
          created_at?: string
          deleted_at?: string | null
          digital_lank?: string | null
          godkand_av?: string | null
          id?: string
          insamlar_lan_kod?: string | null
          installt_forekomster?: string[]
          kontakt_epost?: string | null
          kontakt_telefon?: string | null
          kostnad?: string | null
          plats_adress?: string | null
          plats_lat?: number | null
          plats_lng?: number | null
          plats_namn?: string | null
          plats_organisation_id?: string | null
          plats_stad?: string | null
          plats_typ: Database["public"]["Enums"]["event_plats_typ"]
          public_id?: string
          publicerad_at?: string | null
          slug: string
          slut_at?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["event_status"]
          titel: string
          typ: Database["public"]["Enums"]["event_typ"]
          updated_at?: string
          upprepning?: Database["public"]["Enums"]["event_upprepning"] | null
          upprepning_slut?: string | null
          upprepning_veckodag?: number | null
        }
        Update: {
          anmalan_lank?: string | null
          arrangor_org_id?: string | null
          arrangor_profil_id?: string | null
          beskrivning?: string
          cover_path?: string | null
          created_at?: string
          deleted_at?: string | null
          digital_lank?: string | null
          godkand_av?: string | null
          id?: string
          insamlar_lan_kod?: string | null
          installt_forekomster?: string[]
          kontakt_epost?: string | null
          kontakt_telefon?: string | null
          kostnad?: string | null
          plats_adress?: string | null
          plats_lat?: number | null
          plats_lng?: number | null
          plats_namn?: string | null
          plats_organisation_id?: string | null
          plats_stad?: string | null
          plats_typ?: Database["public"]["Enums"]["event_plats_typ"]
          public_id?: string
          publicerad_at?: string | null
          slug?: string
          slut_at?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          titel?: string
          typ?: Database["public"]["Enums"]["event_typ"]
          updated_at?: string
          upprepning?: Database["public"]["Enums"]["event_upprepning"] | null
          upprepning_slut?: string | null
          upprepning_veckodag?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_arrangor_org_id_fkey"
            columns: ["arrangor_org_id"]
            isOneToOne: false
            referencedRelation: "organisation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_arrangor_profil_id_fkey"
            columns: ["arrangor_profil_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_arrangor_profil_id_fkey"
            columns: ["arrangor_profil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_godkand_av_fkey"
            columns: ["godkand_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_godkand_av_fkey"
            columns: ["godkand_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_insamlar_lan_kod_fkey"
            columns: ["insamlar_lan_kod"]
            isOneToOne: false
            referencedRelation: "plats_taxonomi"
            referencedColumns: ["kod"]
          },
          {
            foreignKeyName: "event_plats_organisation_id_fkey"
            columns: ["plats_organisation_id"]
            isOneToOne: false
            referencedRelation: "organisation"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_aggregat: {
        Row: {
          aktiva_antal: number
          avslutade_levererade: number
          beraknad_at: string
          id: string
          insamlat_summa_ore: number
          insamlingar_antal: number
          kategori_id: string | null
          omrade_kod: string
          omrade_typ: string
          under_troskel: boolean
          verifierade_insamlare: number
        }
        Insert: {
          aktiva_antal?: number
          avslutade_levererade?: number
          beraknad_at?: string
          id?: string
          insamlat_summa_ore?: number
          insamlingar_antal?: number
          kategori_id?: string | null
          omrade_kod: string
          omrade_typ: string
          under_troskel?: boolean
          verifierade_insamlare?: number
        }
        Update: {
          aktiva_antal?: number
          avslutade_levererade?: number
          beraknad_at?: string
          id?: string
          insamlat_summa_ore?: number
          insamlingar_antal?: number
          kategori_id?: string | null
          omrade_kod?: string
          omrade_typ?: string
          under_troskel?: boolean
          verifierade_insamlare?: number
        }
        Relationships: [
          {
            foreignKeyName: "geo_aggregat_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geo_aggregat_omrade_kod_fkey"
            columns: ["omrade_kod"]
            isOneToOne: false
            referencedRelation: "plats_taxonomi"
            referencedColumns: ["kod"]
          },
        ]
      }
      granskning: {
        Row: {
          arende_typ: string
          avgjord_at: string | null
          created_at: string
          eskalerad: boolean
          event_id: string | null
          id: string
          insamling_id: string | null
          inskickad_at: string
          interna_anteckningar: string | null
          jav_markerad: boolean
          jav_markerad_at: string | null
          jav_markerad_av: string | null
          jav_skal: string | null
          region_kod: string | null
          runda: number
          sla_deadline: string | null
          tilldelad_granskare_id: string | null
          updated_at: string
        }
        Insert: {
          arende_typ?: string
          avgjord_at?: string | null
          created_at?: string
          eskalerad?: boolean
          event_id?: string | null
          id?: string
          insamling_id?: string | null
          inskickad_at?: string
          interna_anteckningar?: string | null
          jav_markerad?: boolean
          jav_markerad_at?: string | null
          jav_markerad_av?: string | null
          jav_skal?: string | null
          region_kod?: string | null
          runda?: number
          sla_deadline?: string | null
          tilldelad_granskare_id?: string | null
          updated_at?: string
        }
        Update: {
          arende_typ?: string
          avgjord_at?: string | null
          created_at?: string
          eskalerad?: boolean
          event_id?: string | null
          id?: string
          insamling_id?: string | null
          inskickad_at?: string
          interna_anteckningar?: string | null
          jav_markerad?: boolean
          jav_markerad_at?: string | null
          jav_markerad_av?: string | null
          jav_skal?: string | null
          region_kod?: string | null
          runda?: number
          sla_deadline?: string | null
          tilldelad_granskare_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "granskning_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "granskning_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "granskning_region_kod_fkey"
            columns: ["region_kod"]
            isOneToOne: false
            referencedRelation: "plats_taxonomi"
            referencedColumns: ["kod"]
          },
          {
            foreignKeyName: "granskning_tilldelad_granskare_id_fkey"
            columns: ["tilldelad_granskare_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "granskning_tilldelad_granskare_id_fkey"
            columns: ["tilldelad_granskare_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      granskning_handelse: {
        Row: {
          beslut: Database["public"]["Enums"]["granskning_beslut"] | null
          created_at: string
          detalj: Json | null
          granskare_id: string | null
          granskning_id: string
          handelse_typ: string
          id: string
          motivering: string | null
        }
        Insert: {
          beslut?: Database["public"]["Enums"]["granskning_beslut"] | null
          created_at?: string
          detalj?: Json | null
          granskare_id?: string | null
          granskning_id: string
          handelse_typ: string
          id?: string
          motivering?: string | null
        }
        Update: {
          beslut?: Database["public"]["Enums"]["granskning_beslut"] | null
          created_at?: string
          detalj?: Json | null
          granskare_id?: string | null
          granskning_id?: string
          handelse_typ?: string
          id?: string
          motivering?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "granskning_handelse_granskare_id_fkey"
            columns: ["granskare_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "granskning_handelse_granskare_id_fkey"
            columns: ["granskare_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "granskning_handelse_granskning_id_fkey"
            columns: ["granskning_id"]
            isOneToOne: false
            referencedRelation: "granskning"
            referencedColumns: ["id"]
          },
        ]
      }
      insamling: {
        Row: {
          agare_id: string
          auto_stang_vid_mal: boolean
          connected_account_id: string | null
          created_at: string
          deleted_at: string | null
          enhet_namn: string | null
          enhet_pris_ore: number | null
          forlangd_antal: number
          frivilligt_bidrag_total_ore: number
          genomforande_datum: string
          godkand_av: string | null
          hjalp_land: string
          hjalp_lat: number | null
          hjalp_lng: number | null
          hjalp_plats: string | null
          id: string
          insamlar_adress: string | null
          insamlar_adress_publik: boolean
          insamlar_kommun_kod: string | null
          insamlar_lan_kod: string | null
          insamlar_region: string | null
          insamlar_stad: string
          insamlat_netto_ore: number
          insamlat_ore: number
          insamling_deadline: string
          inskickad_at: string | null
          kanslig: boolean
          kanslig_motivering: string | null
          kommentarer_avstangda: boolean
          kort_beskrivning: string
          lang_beskrivning: string
          malbelopp_max_ore: number | null
          malbelopp_min_ore: number | null
          malbelopp_modell: Database["public"]["Enums"]["malbelopp_modell"]
          malbelopp_ore: number | null
          mission_id: string | null
          mottagare_beskrivning: string
          mottagare_typ: string
          overmalsplan: string | null
          public_id: string
          publicerad_at: string | null
          slug: string
          stangd_at: string | null
          status: Database["public"]["Enums"]["insamling_status"]
          tillat_overmal: boolean
          titel: string
          transfer_group: string | null
          undermal_default_val: Database["public"]["Enums"]["donation_undermal_val"]
          updated_at: string
          utbetald_ore: number
          valuta: string
        }
        Insert: {
          agare_id: string
          auto_stang_vid_mal?: boolean
          connected_account_id?: string | null
          created_at?: string
          deleted_at?: string | null
          enhet_namn?: string | null
          enhet_pris_ore?: number | null
          forlangd_antal?: number
          frivilligt_bidrag_total_ore?: number
          genomforande_datum: string
          godkand_av?: string | null
          hjalp_land: string
          hjalp_lat?: number | null
          hjalp_lng?: number | null
          hjalp_plats?: string | null
          id?: string
          insamlar_adress?: string | null
          insamlar_adress_publik?: boolean
          insamlar_kommun_kod?: string | null
          insamlar_lan_kod?: string | null
          insamlar_region?: string | null
          insamlar_stad: string
          insamlat_netto_ore?: number
          insamlat_ore?: number
          insamling_deadline: string
          inskickad_at?: string | null
          kanslig?: boolean
          kanslig_motivering?: string | null
          kommentarer_avstangda?: boolean
          kort_beskrivning: string
          lang_beskrivning: string
          malbelopp_max_ore?: number | null
          malbelopp_min_ore?: number | null
          malbelopp_modell: Database["public"]["Enums"]["malbelopp_modell"]
          malbelopp_ore?: number | null
          mission_id?: string | null
          mottagare_beskrivning: string
          mottagare_typ: string
          overmalsplan?: string | null
          public_id?: string
          publicerad_at?: string | null
          slug: string
          stangd_at?: string | null
          status?: Database["public"]["Enums"]["insamling_status"]
          tillat_overmal?: boolean
          titel: string
          transfer_group?: string | null
          undermal_default_val?: Database["public"]["Enums"]["donation_undermal_val"]
          updated_at?: string
          utbetald_ore?: number
          valuta?: string
        }
        Update: {
          agare_id?: string
          auto_stang_vid_mal?: boolean
          connected_account_id?: string | null
          created_at?: string
          deleted_at?: string | null
          enhet_namn?: string | null
          enhet_pris_ore?: number | null
          forlangd_antal?: number
          frivilligt_bidrag_total_ore?: number
          genomforande_datum?: string
          godkand_av?: string | null
          hjalp_land?: string
          hjalp_lat?: number | null
          hjalp_lng?: number | null
          hjalp_plats?: string | null
          id?: string
          insamlar_adress?: string | null
          insamlar_adress_publik?: boolean
          insamlar_kommun_kod?: string | null
          insamlar_lan_kod?: string | null
          insamlar_region?: string | null
          insamlar_stad?: string
          insamlat_netto_ore?: number
          insamlat_ore?: number
          insamling_deadline?: string
          inskickad_at?: string | null
          kanslig?: boolean
          kanslig_motivering?: string | null
          kommentarer_avstangda?: boolean
          kort_beskrivning?: string
          lang_beskrivning?: string
          malbelopp_max_ore?: number | null
          malbelopp_min_ore?: number | null
          malbelopp_modell?: Database["public"]["Enums"]["malbelopp_modell"]
          malbelopp_ore?: number | null
          mission_id?: string | null
          mottagare_beskrivning?: string
          mottagare_typ?: string
          overmalsplan?: string | null
          public_id?: string
          publicerad_at?: string | null
          slug?: string
          stangd_at?: string | null
          status?: Database["public"]["Enums"]["insamling_status"]
          tillat_overmal?: boolean
          titel?: string
          transfer_group?: string | null
          undermal_default_val?: Database["public"]["Enums"]["donation_undermal_val"]
          updated_at?: string
          utbetald_ore?: number
          valuta?: string
        }
        Relationships: [
          {
            foreignKeyName: "insamling_agare_id_fkey"
            columns: ["agare_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insamling_agare_id_fkey"
            columns: ["agare_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insamling_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insamling_godkand_av_fkey"
            columns: ["godkand_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insamling_godkand_av_fkey"
            columns: ["godkand_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insamling_insamlar_kommun_kod_fkey"
            columns: ["insamlar_kommun_kod"]
            isOneToOne: false
            referencedRelation: "plats_taxonomi"
            referencedColumns: ["kod"]
          },
          {
            foreignKeyName: "insamling_insamlar_lan_kod_fkey"
            columns: ["insamlar_lan_kod"]
            isOneToOne: false
            referencedRelation: "plats_taxonomi"
            referencedColumns: ["kod"]
          },
          {
            foreignKeyName: "insamling_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "mission"
            referencedColumns: ["id"]
          },
        ]
      }
      insamling_andringslogg: {
        Row: {
          andrad_av: string | null
          beskrivning: string | null
          created_at: string
          falt: string
          handelse: string
          id: string
          insamling_id: string
        }
        Insert: {
          andrad_av?: string | null
          beskrivning?: string | null
          created_at?: string
          falt: string
          handelse: string
          id?: string
          insamling_id: string
        }
        Update: {
          andrad_av?: string | null
          beskrivning?: string | null
          created_at?: string
          falt?: string
          handelse?: string
          id?: string
          insamling_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insamling_andringslogg_andrad_av_fkey"
            columns: ["andrad_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insamling_andringslogg_andrad_av_fkey"
            columns: ["andrad_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insamling_andringslogg_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
        ]
      }
      insamling_badge: {
        Row: {
          badge_id: string
          indragen_at: string | null
          insamling_id: string
          tilldelad_at: string
        }
        Insert: {
          badge_id: string
          indragen_at?: string | null
          insamling_id: string
          tilldelad_at?: string
        }
        Update: {
          badge_id?: string
          indragen_at?: string | null
          insamling_id?: string
          tilldelad_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insamling_badge_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insamling_badge_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
        ]
      }
      insamling_kategori: {
        Row: {
          insamling_id: string
          kategori_id: string
        }
        Insert: {
          insamling_id: string
          kategori_id: string
        }
        Update: {
          insamling_id?: string
          kategori_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insamling_kategori_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insamling_kategori_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori"
            referencedColumns: ["id"]
          },
        ]
      }
      insamling_media: {
        Row: {
          bredd_px: number | null
          created_at: string
          hojd_px: number | null
          id: string
          insamling_id: string
          original_path: string | null
          roll: Database["public"]["Enums"]["media_roll"]
          sortering: number
          storage_path: string
          updated_at: string
          uppdatering_id: string | null
        }
        Insert: {
          bredd_px?: number | null
          created_at?: string
          hojd_px?: number | null
          id?: string
          insamling_id: string
          original_path?: string | null
          roll: Database["public"]["Enums"]["media_roll"]
          sortering?: number
          storage_path: string
          updated_at?: string
          uppdatering_id?: string | null
        }
        Update: {
          bredd_px?: number | null
          created_at?: string
          hojd_px?: number | null
          id?: string
          insamling_id?: string
          original_path?: string | null
          roll?: Database["public"]["Enums"]["media_roll"]
          sortering?: number
          storage_path?: string
          updated_at?: string
          uppdatering_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insamling_media_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
        ]
      }
      kategori: {
        Row: {
          aktiv: boolean
          created_at: string
          id: string
          namn: string
          slug: string
          sortering: number
          updated_at: string
        }
        Insert: {
          aktiv?: boolean
          created_at?: string
          id?: string
          namn: string
          slug: string
          sortering?: number
          updated_at?: string
        }
        Update: {
          aktiv?: boolean
          created_at?: string
          id?: string
          namn?: string
          slug?: string
          sortering?: number
          updated_at?: string
        }
        Relationships: []
      }
      kommentar: {
        Row: {
          author_id: string
          created_at: string
          dold: boolean
          dold_skal: string | null
          flaggor: Json
          id: string
          insamling_id: string
          objekt_typ: Database["public"]["Enums"]["community_objekt_typ"]
          parent_id: string | null
          public_id: string
          raderad_at: string | null
          rapporter_antal: number
          text: string
          updated_at: string
          uppdatering_id: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          dold?: boolean
          dold_skal?: string | null
          flaggor?: Json
          id?: string
          insamling_id: string
          objekt_typ: Database["public"]["Enums"]["community_objekt_typ"]
          parent_id?: string | null
          public_id?: string
          raderad_at?: string | null
          rapporter_antal?: number
          text: string
          updated_at?: string
          uppdatering_id?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          dold?: boolean
          dold_skal?: string | null
          flaggor?: Json
          id?: string
          insamling_id?: string
          objekt_typ?: Database["public"]["Enums"]["community_objekt_typ"]
          parent_id?: string | null
          public_id?: string
          raderad_at?: string | null
          rapporter_antal?: number
          text?: string
          updated_at?: string
          uppdatering_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kommentar_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kommentar_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kommentar_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kommentar_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "kommentar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kommentar_uppdatering_id_fkey"
            columns: ["uppdatering_id"]
            isOneToOne: false
            referencedRelation: "transparens_uppdatering"
            referencedColumns: ["id"]
          },
        ]
      }
      mission: {
        Row: {
          agare_id: string
          beskrivning: string | null
          created_at: string
          id: string
          public_id: string
          titel: string
          updated_at: string
        }
        Insert: {
          agare_id: string
          beskrivning?: string | null
          created_at?: string
          id?: string
          public_id?: string
          titel: string
          updated_at?: string
        }
        Update: {
          agare_id?: string
          beskrivning?: string | null
          created_at?: string
          id?: string
          public_id?: string
          titel?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_agare_id_fkey"
            columns: ["agare_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_agare_id_fkey"
            columns: ["agare_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mottagare_dokument: {
        Row: {
          beskrivning: string | null
          created_at: string
          id: string
          insamling_id: string
          storage_path: string
        }
        Insert: {
          beskrivning?: string | null
          created_at?: string
          id?: string
          insamling_id: string
          storage_path: string
        }
        Update: {
          beskrivning?: string | null
          created_at?: string
          id?: string
          insamling_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "mottagare_dokument_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
        ]
      }
      notis: {
        Row: {
          badge_id: string | null
          created_at: string
          donation_id: string | null
          epost_skickad_at: string | null
          epost_status: string | null
          grupp: Database["public"]["Enums"]["notis_grupp"]
          id: string
          insamling_id: string | null
          lank: string | null
          last_at: string | null
          metadata: Json
          mottagare_id: string
          text: string | null
          titel: string
          typ: Database["public"]["Enums"]["notis_typ"]
        }
        Insert: {
          badge_id?: string | null
          created_at?: string
          donation_id?: string | null
          epost_skickad_at?: string | null
          epost_status?: string | null
          grupp: Database["public"]["Enums"]["notis_grupp"]
          id?: string
          insamling_id?: string | null
          lank?: string | null
          last_at?: string | null
          metadata?: Json
          mottagare_id: string
          text?: string | null
          titel: string
          typ: Database["public"]["Enums"]["notis_typ"]
        }
        Update: {
          badge_id?: string | null
          created_at?: string
          donation_id?: string | null
          epost_skickad_at?: string | null
          epost_status?: string | null
          grupp?: Database["public"]["Enums"]["notis_grupp"]
          id?: string
          insamling_id?: string | null
          lank?: string | null
          last_at?: string | null
          metadata?: Json
          mottagare_id?: string
          text?: string | null
          titel?: string
          typ?: Database["public"]["Enums"]["notis_typ"]
        }
        Relationships: [
          {
            foreignKeyName: "notis_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notis_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notis_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notis_mottagare_id_fkey"
            columns: ["mottagare_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notis_mottagare_id_fkey"
            columns: ["mottagare_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notis_preferens: {
        Row: {
          epost: boolean
          grupp: Database["public"]["Enums"]["notis_grupp"]
          in_app: boolean
          profil_id: string
          push: boolean
          uppdaterad_at: string
        }
        Insert: {
          epost?: boolean
          grupp: Database["public"]["Enums"]["notis_grupp"]
          in_app?: boolean
          profil_id: string
          push?: boolean
          uppdaterad_at?: string
        }
        Update: {
          epost?: boolean
          grupp?: Database["public"]["Enums"]["notis_grupp"]
          in_app?: boolean
          profil_id?: string
          push?: boolean
          uppdaterad_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notis_preferens_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notis_preferens_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oppettid: {
        Row: {
          ar_stangd: boolean
          created_at: string
          id: string
          notering: string | null
          oppnar: string | null
          organisation_id: string
          stanger: string | null
          updated_at: string
          veckodag: number
        }
        Insert: {
          ar_stangd?: boolean
          created_at?: string
          id?: string
          notering?: string | null
          oppnar?: string | null
          organisation_id: string
          stanger?: string | null
          updated_at?: string
          veckodag: number
        }
        Update: {
          ar_stangd?: boolean
          created_at?: string
          id?: string
          notering?: string | null
          oppnar?: string | null
          organisation_id?: string
          stanger?: string | null
          updated_at?: string
          veckodag?: number
        }
        Relationships: [
          {
            foreignKeyName: "oppettid_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisation"
            referencedColumns: ["id"]
          },
        ]
      }
      ordlista: {
        Row: {
          aktiv: boolean
          created_at: string
          id: string
          inlagd_av: string | null
          kategori: string
          noteringar: string | null
          severity: Database["public"]["Enums"]["ordlista_severity"]
          term: string
          updated_at: string
        }
        Insert: {
          aktiv?: boolean
          created_at?: string
          id?: string
          inlagd_av?: string | null
          kategori: string
          noteringar?: string | null
          severity: Database["public"]["Enums"]["ordlista_severity"]
          term: string
          updated_at?: string
        }
        Update: {
          aktiv?: boolean
          created_at?: string
          id?: string
          inlagd_av?: string | null
          kategori?: string
          noteringar?: string | null
          severity?: Database["public"]["Enums"]["ordlista_severity"]
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordlista_inlagd_av_fkey"
            columns: ["inlagd_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordlista_inlagd_av_fkey"
            columns: ["inlagd_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation: {
        Row: {
          ar_region_admin: boolean
          beskrivning: string
          besoksadress: string | null
          created_at: string
          deleted_at: string | null
          forenings_konto_aktiverat_at: string | null
          forenings_konto_user_id: string | null
          id: string
          katalog_status: string
          kontaktperson_epost: string | null
          kontaktperson_namn: string | null
          logotyp_path: string | null
          namn: string
          org_nummer: string | null
          organisationstyp: string
          profil_id: string | null
          public_id: string
          region: string
          stad: string
          updated_at: string
          verifieringsniva: string | null
        }
        Insert: {
          ar_region_admin?: boolean
          beskrivning: string
          besoksadress?: string | null
          created_at?: string
          deleted_at?: string | null
          forenings_konto_aktiverat_at?: string | null
          forenings_konto_user_id?: string | null
          id?: string
          katalog_status?: string
          kontaktperson_epost?: string | null
          kontaktperson_namn?: string | null
          logotyp_path?: string | null
          namn: string
          org_nummer?: string | null
          organisationstyp: string
          profil_id?: string | null
          public_id?: string
          region: string
          stad: string
          updated_at?: string
          verifieringsniva?: string | null
        }
        Update: {
          ar_region_admin?: boolean
          beskrivning?: string
          besoksadress?: string | null
          created_at?: string
          deleted_at?: string | null
          forenings_konto_aktiverat_at?: string | null
          forenings_konto_user_id?: string | null
          id?: string
          katalog_status?: string
          kontaktperson_epost?: string | null
          kontaktperson_namn?: string | null
          logotyp_path?: string | null
          namn?: string
          org_nummer?: string | null
          organisationstyp?: string
          profil_id?: string | null
          public_id?: string
          region?: string
          stad?: string
          updated_at?: string
          verifieringsniva?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisation_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: true
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      overklagande: {
        Row: {
          beslut_motivering: string | null
          created_at: string
          hanterad_at: string | null
          hanterad_av: string | null
          id: string
          insamlare_id: string
          insamling_id: string
          skal: string
          status: Database["public"]["Enums"]["overklagande_status"]
        }
        Insert: {
          beslut_motivering?: string | null
          created_at?: string
          hanterad_at?: string | null
          hanterad_av?: string | null
          id?: string
          insamlare_id: string
          insamling_id: string
          skal: string
          status?: Database["public"]["Enums"]["overklagande_status"]
        }
        Update: {
          beslut_motivering?: string | null
          created_at?: string
          hanterad_at?: string | null
          hanterad_av?: string | null
          id?: string
          insamlare_id?: string
          insamling_id?: string
          skal?: string
          status?: Database["public"]["Enums"]["overklagande_status"]
        }
        Relationships: [
          {
            foreignKeyName: "overklagande_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          arrival_date: string | null
          belopp_ore: number
          connected_account_id: string
          created_at: string
          currency: string
          failure_code: string | null
          failure_reason: string | null
          id: string
          insamling_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          stripe_payout_id: string | null
          updated_at: string
        }
        Insert: {
          arrival_date?: string | null
          belopp_ore: number
          connected_account_id: string
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          insamling_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_payout_id?: string | null
          updated_at?: string
        }
        Update: {
          arrival_date?: string | null
          belopp_ore?: number
          connected_account_id?: string
          created_at?: string
          currency?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          insamling_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          stripe_payout_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
        ]
      }
      plats_taxonomi: {
        Row: {
          created_at: string
          iso_3166_2: string | null
          kod: string
          kort_namn: string
          namn: string
          niva: string
          parent_kod: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          iso_3166_2?: string | null
          kod: string
          kort_namn: string
          namn: string
          niva: string
          parent_kod?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          iso_3166_2?: string | null
          kod?: string
          kort_namn?: string
          namn?: string
          niva?: string
          parent_kod?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plats_taxonomi_parent_kod_fkey"
            columns: ["parent_kod"]
            isOneToOne: false
            referencedRelation: "plats_taxonomi"
            referencedColumns: ["kod"]
          },
        ]
      }
      profil_badge: {
        Row: {
          antal: number
          badge_id: string
          profil_id: string
          uppdaterad_at: string
        }
        Insert: {
          antal?: number
          badge_id: string
          profil_id: string
          uppdaterad_at?: string
        }
        Update: {
          antal?: number
          badge_id?: string
          profil_id?: string
          uppdaterad_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profil_badge_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profil_badge_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profil_badge_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_niva: string | null
          admin_region_kod: string | null
          ar_organisation: boolean
          avatar_url: string | null
          bankid_verifierad: boolean
          created_at: string
          deleted_at: string | null
          e_post: string
          id: string
          kontofryst: boolean
          ombud_kontakt: string | null
          personnummer_krypterat: string | null
          presentation: string | null
          public_id: string
          region: string | null
          roll: Database["public"]["Enums"]["anvandar_roll"]
          skyddad_identitet: boolean
          stad: string | null
          stripe_account_id: string | null
          stripe_onboarding_klar: boolean
          team_inaktiverad_at: string | null
          updated_at: string
          visa_stad: boolean
          visa_total_summa: boolean
          visningsnamn: string
        }
        Insert: {
          admin_niva?: string | null
          admin_region_kod?: string | null
          ar_organisation?: boolean
          avatar_url?: string | null
          bankid_verifierad?: boolean
          created_at?: string
          deleted_at?: string | null
          e_post: string
          id: string
          kontofryst?: boolean
          ombud_kontakt?: string | null
          personnummer_krypterat?: string | null
          presentation?: string | null
          public_id?: string
          region?: string | null
          roll?: Database["public"]["Enums"]["anvandar_roll"]
          skyddad_identitet?: boolean
          stad?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_klar?: boolean
          team_inaktiverad_at?: string | null
          updated_at?: string
          visa_stad?: boolean
          visa_total_summa?: boolean
          visningsnamn: string
        }
        Update: {
          admin_niva?: string | null
          admin_region_kod?: string | null
          ar_organisation?: boolean
          avatar_url?: string | null
          bankid_verifierad?: boolean
          created_at?: string
          deleted_at?: string | null
          e_post?: string
          id?: string
          kontofryst?: boolean
          ombud_kontakt?: string | null
          personnummer_krypterat?: string | null
          presentation?: string | null
          public_id?: string
          region?: string | null
          roll?: Database["public"]["Enums"]["anvandar_roll"]
          skyddad_identitet?: boolean
          stad?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_klar?: boolean
          team_inaktiverad_at?: string | null
          updated_at?: string
          visa_stad?: boolean
          visa_total_summa?: boolean
          visningsnamn?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_admin_region_kod_fkey"
            columns: ["admin_region_kod"]
            isOneToOne: false
            referencedRelation: "plats_taxonomi"
            referencedColumns: ["kod"]
          },
        ]
      }
      rapport: {
        Row: {
          created_at: string
          granskad_at: string | null
          granskad_av: string | null
          id: string
          kommentar_id: string
          reporter_id: string | null
          skal: string
          status: string
        }
        Insert: {
          created_at?: string
          granskad_at?: string | null
          granskad_av?: string | null
          id?: string
          kommentar_id: string
          reporter_id?: string | null
          skal: string
          status?: string
        }
        Update: {
          created_at?: string
          granskad_at?: string | null
          granskad_av?: string | null
          id?: string
          kommentar_id?: string
          reporter_id?: string | null
          skal?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rapport_granskad_av_fkey"
            columns: ["granskad_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapport_granskad_av_fkey"
            columns: ["granskad_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapport_kommentar_id_fkey"
            columns: ["kommentar_id"]
            isOneToOne: false
            referencedRelation: "kommentar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapport_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapport_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reaktion: {
        Row: {
          created_at: string
          id: string
          insamling_id: string
          objekt_typ: Database["public"]["Enums"]["community_objekt_typ"]
          typ: Database["public"]["Enums"]["reaktion_typ"]
          uppdatering_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insamling_id: string
          objekt_typ: Database["public"]["Enums"]["community_objekt_typ"]
          typ: Database["public"]["Enums"]["reaktion_typ"]
          uppdatering_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insamling_id?: string
          objekt_typ?: Database["public"]["Enums"]["community_objekt_typ"]
          typ?: Database["public"]["Enums"]["reaktion_typ"]
          uppdatering_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reaktion_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reaktion_uppdatering_id_fkey"
            columns: ["uppdatering_id"]
            isOneToOne: false
            referencedRelation: "transparens_uppdatering"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reaktion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reaktion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          anledning: Database["public"]["Enums"]["refund_anledning"]
          belopp_ore: number
          beslutsnotering: string | null
          created_at: string
          currency: string
          donation_id: string
          failure_reason: string | null
          id: string
          idempotency_key: string
          initierad_av: string | null
          status: Database["public"]["Enums"]["refund_status"]
          stripe_refund_id: string | null
          updated_at: string
        }
        Insert: {
          anledning: Database["public"]["Enums"]["refund_anledning"]
          belopp_ore: number
          beslutsnotering?: string | null
          created_at?: string
          currency?: string
          donation_id: string
          failure_reason?: string | null
          id?: string
          idempotency_key: string
          initierad_av?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Update: {
          anledning?: Database["public"]["Enums"]["refund_anledning"]
          belopp_ore?: number
          beslutsnotering?: string | null
          created_at?: string
          currency?: string
          donation_id?: string
          failure_reason?: string | null
          id?: string
          idempotency_key?: string
          initierad_av?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_initierad_av_fkey"
            columns: ["initierad_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_initierad_av_fkey"
            columns: ["initierad_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity_log: {
        Row: {
          beskrivning: string
          created_at: string
          detaljer: Json
          id: string
          ip_hash: string | null
          profile_id: string | null
          typ: Database["public"]["Enums"]["team_aktivitet_typ"]
          utfort_av: string | null
        }
        Insert: {
          beskrivning: string
          created_at?: string
          detaljer?: Json
          id?: string
          ip_hash?: string | null
          profile_id?: string | null
          typ: Database["public"]["Enums"]["team_aktivitet_typ"]
          utfort_av?: string | null
        }
        Update: {
          beskrivning?: string
          created_at?: string
          detaljer?: Json
          id?: string
          ip_hash?: string | null
          profile_id?: string | null
          typ?: Database["public"]["Enums"]["team_aktivitet_typ"]
          utfort_av?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_log_utfort_av_fkey"
            columns: ["utfort_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_activity_log_utfort_av_fkey"
            columns: ["utfort_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitation: {
        Row: {
          avbruten_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          inbjuden_av: string
          noteringar: string | null
          redeemed_at: string | null
          redeemed_av: string | null
          roll: Database["public"]["Enums"]["anvandar_roll"]
          token: string
        }
        Insert: {
          avbruten_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          inbjuden_av: string
          noteringar?: string | null
          redeemed_at?: string | null
          redeemed_av?: string | null
          roll: Database["public"]["Enums"]["anvandar_roll"]
          token?: string
        }
        Update: {
          avbruten_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          inbjuden_av?: string
          noteringar?: string | null
          redeemed_at?: string | null
          redeemed_av?: string | null
          roll?: Database["public"]["Enums"]["anvandar_roll"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitation_inbjuden_av_fkey"
            columns: ["inbjuden_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitation_inbjuden_av_fkey"
            columns: ["inbjuden_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitation_redeemed_av_fkey"
            columns: ["redeemed_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitation_redeemed_av_fkey"
            columns: ["redeemed_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          belopp_ore: number
          connected_account_id: string
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          idempotency_key: string
          insamling_id: string
          status: Database["public"]["Enums"]["transfer_status"]
          stripe_transfer_id: string | null
          syfte: string
          transfer_group: string
          updated_at: string
        }
        Insert: {
          belopp_ore: number
          connected_account_id: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          idempotency_key: string
          insamling_id: string
          status?: Database["public"]["Enums"]["transfer_status"]
          stripe_transfer_id?: string | null
          syfte?: string
          transfer_group: string
          updated_at?: string
        }
        Update: {
          belopp_ore?: number
          connected_account_id?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          idempotency_key?: string
          insamling_id?: string
          status?: Database["public"]["Enums"]["transfer_status"]
          stripe_transfer_id?: string | null
          syfte?: string
          transfer_group?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
        ]
      }
      transparens_bevis: {
        Row: {
          bevis_typ: string
          created_at: string
          godkant_at: string | null
          godkant_av: string | null
          id: string
          insamling_id: string
          kategori_id: string | null
          systemgenererad: boolean
          updated_at: string
          uppdatering_id: string | null
        }
        Insert: {
          bevis_typ: string
          created_at?: string
          godkant_at?: string | null
          godkant_av?: string | null
          id?: string
          insamling_id: string
          kategori_id?: string | null
          systemgenererad?: boolean
          updated_at?: string
          uppdatering_id?: string | null
        }
        Update: {
          bevis_typ?: string
          created_at?: string
          godkant_at?: string | null
          godkant_av?: string | null
          id?: string
          insamling_id?: string
          kategori_id?: string | null
          systemgenererad?: boolean
          updated_at?: string
          uppdatering_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transparens_bevis_godkant_av_fkey"
            columns: ["godkant_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transparens_bevis_godkant_av_fkey"
            columns: ["godkant_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transparens_bevis_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transparens_bevis_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transparens_bevis_uppdatering_id_fkey"
            columns: ["uppdatering_id"]
            isOneToOne: false
            referencedRelation: "transparens_uppdatering"
            referencedColumns: ["id"]
          },
        ]
      }
      transparens_uppdatering: {
        Row: {
          ar_bevis: boolean
          created_at: string
          dold: boolean
          id: string
          insamling_id: string
          postad_av: string | null
          text: string
          updated_at: string
        }
        Insert: {
          ar_bevis?: boolean
          created_at?: string
          dold?: boolean
          id?: string
          insamling_id: string
          postad_av?: string | null
          text: string
          updated_at?: string
        }
        Update: {
          ar_bevis?: boolean
          created_at?: string
          dold?: boolean
          id?: string
          insamling_id?: string
          postad_av?: string | null
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transparens_uppdatering_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transparens_uppdatering_postad_av_fkey"
            columns: ["postad_av"]
            isOneToOne: false
            referencedRelation: "profil_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transparens_uppdatering_postad_av_fkey"
            columns: ["postad_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          api_version: string | null
          error_message: string | null
          event_type: string
          livemode: boolean
          payload: Json
          processed_at: string | null
          received_at: string
          status: Database["public"]["Enums"]["webhook_event_status"]
          stripe_account: string | null
          stripe_event_id: string
        }
        Insert: {
          api_version?: string | null
          error_message?: string | null
          event_type: string
          livemode?: boolean
          payload: Json
          processed_at?: string | null
          received_at?: string
          status?: Database["public"]["Enums"]["webhook_event_status"]
          stripe_account?: string | null
          stripe_event_id: string
        }
        Update: {
          api_version?: string | null
          error_message?: string | null
          event_type?: string
          livemode?: boolean
          payload?: Json
          processed_at?: string | null
          received_at?: string
          status?: Database["public"]["Enums"]["webhook_event_status"]
          stripe_account?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profil_publik: {
        Row: {
          antal_insamlingar: number | null
          antal_levererade: number | null
          antal_utan_resultat: number | null
          antal_vantar_resultat: number | null
          ar_organisation: boolean | null
          avatar_url: string | null
          bankid_verifierad: boolean | null
          id: string | null
          medlem_sedan: string | null
          presentation: string | null
          public_id: string | null
          region: string | null
          roll: Database["public"]["Enums"]["anvandar_roll"] | null
          stad: string | null
          total_insamlat_ore: number | null
          visningsnamn: string | null
        }
        Insert: {
          antal_insamlingar?: never
          antal_levererade?: never
          antal_utan_resultat?: never
          antal_vantar_resultat?: never
          ar_organisation?: boolean | null
          avatar_url?: string | null
          bankid_verifierad?: boolean | null
          id?: string | null
          medlem_sedan?: string | null
          presentation?: string | null
          public_id?: string | null
          region?: never
          roll?: Database["public"]["Enums"]["anvandar_roll"] | null
          stad?: never
          total_insamlat_ore?: never
          visningsnamn?: string | null
        }
        Update: {
          antal_insamlingar?: never
          antal_levererade?: never
          antal_utan_resultat?: never
          antal_vantar_resultat?: never
          ar_organisation?: boolean | null
          avatar_url?: string | null
          bankid_verifierad?: boolean | null
          id?: string | null
          medlem_sedan?: string | null
          presentation?: string | null
          public_id?: string | null
          region?: never
          roll?: Database["public"]["Enums"]["anvandar_roll"] | null
          stad?: never
          total_insamlat_ore?: never
          visningsnamn?: string | null
        }
        Relationships: []
      }
      transparens_tidslinje: {
        Row: {
          godkant_at: string | null
          id: string | null
          insamling_id: string | null
          post_typ: string | null
          sorterings_tid: string | null
          sub_typ: string | null
          systemgenererad: boolean | null
          text: string | null
          uppdatering_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_aterstall_insamling: {
        Args: { p_insamling_id: string; p_motivering: string }
        Returns: undefined
      }
      admin_avfard_larm: {
        Args: { p_larm_id: string; p_motivering: string }
        Returns: undefined
      }
      admin_bjud_in_team_medlem: {
        Args: {
          p_email: string
          p_noteringar?: string
          p_roll: Database["public"]["Enums"]["anvandar_roll"]
        }
        Returns: string
      }
      admin_inaktivera_team_medlem: {
        Args: { p_motivering: string; p_profile_id: string }
        Returns: undefined
      }
      admin_initiera_refund_donation: {
        Args: {
          p_anledning: Database["public"]["Enums"]["refund_anledning"]
          p_donation_id: string
          p_motivering: string
        }
        Returns: string
      }
      admin_initiera_refund_insamling: {
        Args: {
          p_anledning: Database["public"]["Enums"]["refund_anledning"]
          p_insamling_id: string
          p_motivering: string
        }
        Returns: number
      }
      admin_logga_mfa_aterstallning: {
        Args: { p_motivering: string; p_profile_id: string }
        Returns: undefined
      }
      admin_pausa_insamling: {
        Args: { p_insamling_id: string; p_motivering: string }
        Returns: undefined
      }
      admin_satt_admin_niva: {
        Args: {
          p_admin_niva: string
          p_motivering: string
          p_profile_id: string
        }
        Returns: undefined
      }
      admin_satt_admin_region: {
        Args: {
          p_motivering: string
          p_profile_id: string
          p_region_kod: string
        }
        Returns: undefined
      }
      admin_satt_kanslig: {
        Args: {
          p_insamling_id: string
          p_kanslig: boolean
          p_motivering: string
        }
        Returns: undefined
      }
      admin_satt_skyddad_identitet: {
        Args: { p_motivering: string; p_profile_id: string; p_skydd: boolean }
        Returns: undefined
      }
      admin_stang_insamling: {
        Args: { p_insamling_id: string; p_motivering: string }
        Returns: undefined
      }
      anmal_organisation: {
        Args: {
          p_beskrivning: string
          p_besoksadress: string
          p_logotyp_path?: string
          p_namn: string
          p_org_nummer: string
          p_organisationstyp: string
          p_region: string
          p_stad: string
        }
        Returns: string
      }
      avvisa_resultat_bevis: {
        Args: { p_bevis_id: string; p_motivering: string }
        Returns: undefined
      }
      backfill_connected_account_for_profil: {
        Args: { p_profile_id: string }
        Returns: number
      }
      begar_collab: {
        Args: {
          p_insamling_id: string
          p_organisation_id: string
          p_typ: Database["public"]["Enums"]["collab_typ"]
        }
        Returns: string
      }
      binda_forenings_konto: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: undefined
      }
      fatta_event_granskar_beslut: {
        Args: {
          p_beslut: Database["public"]["Enums"]["granskning_beslut"]
          p_granskning_id: string
          p_motivering: string
        }
        Returns: undefined
      }
      fatta_granskar_beslut: {
        Args: {
          p_beslut: Database["public"]["Enums"]["granskning_beslut"]
          p_granskning_id: string
          p_motivering: string
        }
        Returns: undefined
      }
      forhandsberakna_refund_insamling: {
        Args: { p_insamling_id: string }
        Returns: {
          antal: number
          summa_ore: number
        }[]
      }
      godkann_resultat_bevis: {
        Args: { p_bevis_id: string }
        Returns: undefined
      }
      granska_organisation: {
        Args: { p_beslut: string; p_motivering?: string; p_org_id: string }
        Returns: undefined
      }
      granskare_aterstall_kommentar: {
        Args: { p_kommentar_id: string }
        Returns: undefined
      }
      granskare_dolj_kommentar: {
        Args: { p_kommentar_id: string; p_skal: string }
        Returns: undefined
      }
      k_anonymity_troskel: { Args: never; Returns: number }
      lamna_overklagande: {
        Args: { p_insamling_id: string; p_skal: string }
        Returns: string
      }
      markera_alla_notiser_lasta: { Args: never; Returns: number }
      markera_jav: {
        Args: { p_granskning_id: string; p_skal: string }
        Returns: undefined
      }
      markera_notis_last: { Args: { p_notis_id: string }; Returns: undefined }
      posta_kommentar: {
        Args: {
          p_insamling_id: string
          p_objekt_typ: Database["public"]["Enums"]["community_objekt_typ"]
          p_parent_id: string
          p_text: string
          p_uppdatering_id: string
        }
        Returns: string
      }
      posta_resultat_bevis: {
        Args: { p_insamling_id: string; p_text: string; p_video_url?: string }
        Returns: string
      }
      posta_uppdatering: {
        Args: { p_insamling_id: string; p_text: string }
        Returns: string
      }
      rakna_om_geo_aggregat: { Args: never; Returns: number }
      rapportera_kommentar: {
        Args: { p_kommentar_id: string; p_skal: string }
        Returns: undefined
      }
      region_ko_oversikt: {
        Args: never
        Returns: {
          aldsta_inskickad_at: string
          eskalerade_antal: number
          oppna_antal: number
          region_kod: string
          region_namn: string
          sla_brott_antal: number
          snittvantetid_timmar: number
        }[]
      }
      sakerstall_transfer_group: {
        Args: { p_insamling_id: string }
        Returns: string
      }
      satt_reaktion: {
        Args: {
          p_insamling_id: string
          p_objekt_typ: Database["public"]["Enums"]["community_objekt_typ"]
          p_typ: Database["public"]["Enums"]["reaktion_typ"]
          p_uppdatering_id: string
        }
        Returns: boolean
      }
      skicka_event_for_granskning: {
        Args: { p_event_id: string }
        Returns: string
      }
      skicka_insamling_for_granskning: {
        Args: { p_insamling_id: string }
        Returns: string
      }
      stickprov_avvikande_granskare: {
        Args: never
        Returns: {
          admin_niva: string
          admin_region_kod: string
          avvisade: number
          avvisningsandel: number
          beslut_totalt: number
          granskare_id: string
          granskare_namn: string
          median_handlaggningstid_h: number
        }[]
      }
      superadmin_avgor_overklagande: {
        Args: {
          p_motivering: string
          p_overklagande_id: string
          p_riv_upp: boolean
        }
        Returns: undefined
      }
      svara_collab: {
        Args: { p_collab_id: string; p_godkand: boolean }
        Returns: undefined
      }
      team_loesa_in_invitation: {
        Args: { p_token: string }
        Returns: Database["public"]["Enums"]["anvandar_roll"]
      }
      tilldela_granskning: {
        Args: { p_granskning_id: string }
        Returns: undefined
      }
      uppdatera_granskning_anteckningar: {
        Args: { p_anteckningar: string; p_granskning_id: string }
        Returns: undefined
      }
    }
    Enums: {
      admin_ingrepp_typ:
        | "pausa_insamling"
        | "aterstall_insamling"
        | "stang_insamling"
        | "installt_event"
        | "initiera_refund"
        | "dolj_kommentar"
        | "aterstall_kommentar"
        | "overrida_falt"
        | "frysning_konto"
        | "aterstall_konto"
        | "avfard_larm"
        | "annat"
      anvandar_roll:
        | "donator"
        | "insamlare"
        | "forening"
        | "granskare"
        | "admin"
      collab_status: "begard" | "godkand" | "avbojd" | "aterkallad"
      collab_typ: "initiativtagare" | "stodjer" | "praktisk_partner"
      community_objekt_typ: "insamling" | "uppdatering"
      connected_account_status:
        | "pending"
        | "restricted"
        | "enabled"
        | "disabled"
      connected_account_typ: "insamlare" | "forening" | "platform"
      dispute_status:
        | "warning_needs_response"
        | "warning_under_review"
        | "warning_closed"
        | "needs_response"
        | "under_review"
        | "won"
        | "lost"
      donation_status:
        | "skapad"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
        | "partially_refunded"
      donation_undermal_val: "ge_anda" | "aterbetala"
      event_plats_typ: "fysisk" | "digital"
      event_status:
        | "utkast"
        | "inskickad"
        | "under_granskning"
        | "andring_begard"
        | "avvisad"
        | "publicerad"
        | "avslutad"
        | "installt"
        | "arkiverad"
      event_typ:
        | "forelasning"
        | "insamlingskvall"
        | "eid_firande"
        | "iftar"
        | "kurs"
        | "familjedag"
        | "ungdom"
        | "sister"
        | "oppet_hus"
        | "annat"
      event_upprepning: "vecka" | "manad"
      granskning_beslut: "godkann" | "begar_andring" | "avvisa"
      insamling_status:
        | "utkast"
        | "inskickad"
        | "under_granskning"
        | "andring_begard"
        | "avvisad"
        | "aktiv"
        | "stangd"
        | "utbetald"
        | "vantar_pa_resultat"
        | "avslutad_levererad"
        | "avslutad_utan_resultat"
        | "pausad"
        | "nedstangd"
      larm_kategori:
        | "sla_brott"
        | "stripe_misslyckande"
        | "stripe_tyst"
        | "ovanligt_pengaflode"
        | "enskild_donation_hog"
        | "snabb_uppgang"
        | "repeat_card"
        | "community_rapport"
        | "manuell"
        | "annat"
      larm_niva: "rod" | "gul" | "gron"
      larm_status: "aktiv" | "avfardad" | "behandlad"
      malbelopp_modell: "fast" | "intervall" | "oppet"
      media_roll:
        | "cover"
        | "gallery"
        | "update"
        | "result_proof"
        | "payout_proof"
      notis_grupp:
        | "mina_insamlingar"
        | "stottat"
        | "community"
        | "upptack"
        | "transaktionellt"
      notis_kanal: "in_app" | "epost" | "push"
      notis_typ:
        | "insamling_inskickad"
        | "granskningsbeslut_godkand"
        | "granskningsbeslut_andring"
        | "granskningsbeslut_avvisad"
        | "donation_mottagen"
        | "ny_donation_till_min_insamling"
        | "min_insamling_nadde_mal"
        | "foljd_insamling_uppdatering"
        | "foljd_insamling_resultat"
        | "foljd_insamling_utbetald"
        | "utbetalningsbesked"
        | "refund_verkstalld"
        | "badge_tilldelad"
        | "paminnelse_resultat_saknas"
        | "konto_atgard"
        | "sakerhet"
        | "system"
      ordlista_severity: "hard_block" | "soft_flag"
      overklagande_status: "inkommit" | "avgjord_uppriven" | "avgjord_bekraftad"
      payout_status: "pending" | "in_transit" | "paid" | "failed" | "canceled"
      reaktion_typ: "dua" | "stod"
      refund_anledning:
        | "bedrageri"
        | "fel_donation"
        | "admin_beslut"
        | "donator_begaran"
      refund_status: "pending" | "succeeded" | "failed" | "canceled"
      team_aktivitet_typ:
        | "invite_skapad"
        | "invite_redeemed"
        | "invite_avbruten"
        | "roll_befordrad"
        | "roll_inaktiverad"
        | "roll_aterstalld"
        | "totp_aktiverad"
        | "totp_aterstalld"
        | "login_team"
        | "session_invalidated"
        | "annat"
      transfer_status: "pending" | "paid" | "reversed" | "failed"
      webhook_event_status: "received" | "processed" | "error" | "skipped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_ingrepp_typ: [
        "pausa_insamling",
        "aterstall_insamling",
        "stang_insamling",
        "installt_event",
        "initiera_refund",
        "dolj_kommentar",
        "aterstall_kommentar",
        "overrida_falt",
        "frysning_konto",
        "aterstall_konto",
        "avfard_larm",
        "annat",
      ],
      anvandar_roll: ["donator", "insamlare", "forening", "granskare", "admin"],
      collab_status: ["begard", "godkand", "avbojd", "aterkallad"],
      collab_typ: ["initiativtagare", "stodjer", "praktisk_partner"],
      community_objekt_typ: ["insamling", "uppdatering"],
      connected_account_status: [
        "pending",
        "restricted",
        "enabled",
        "disabled",
      ],
      connected_account_typ: ["insamlare", "forening", "platform"],
      dispute_status: [
        "warning_needs_response",
        "warning_under_review",
        "warning_closed",
        "needs_response",
        "under_review",
        "won",
        "lost",
      ],
      donation_status: [
        "skapad",
        "processing",
        "succeeded",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      donation_undermal_val: ["ge_anda", "aterbetala"],
      event_plats_typ: ["fysisk", "digital"],
      event_status: [
        "utkast",
        "inskickad",
        "under_granskning",
        "andring_begard",
        "avvisad",
        "publicerad",
        "avslutad",
        "installt",
        "arkiverad",
      ],
      event_typ: [
        "forelasning",
        "insamlingskvall",
        "eid_firande",
        "iftar",
        "kurs",
        "familjedag",
        "ungdom",
        "sister",
        "oppet_hus",
        "annat",
      ],
      event_upprepning: ["vecka", "manad"],
      granskning_beslut: ["godkann", "begar_andring", "avvisa"],
      insamling_status: [
        "utkast",
        "inskickad",
        "under_granskning",
        "andring_begard",
        "avvisad",
        "aktiv",
        "stangd",
        "utbetald",
        "vantar_pa_resultat",
        "avslutad_levererad",
        "avslutad_utan_resultat",
        "pausad",
        "nedstangd",
      ],
      larm_kategori: [
        "sla_brott",
        "stripe_misslyckande",
        "stripe_tyst",
        "ovanligt_pengaflode",
        "enskild_donation_hog",
        "snabb_uppgang",
        "repeat_card",
        "community_rapport",
        "manuell",
        "annat",
      ],
      larm_niva: ["rod", "gul", "gron"],
      larm_status: ["aktiv", "avfardad", "behandlad"],
      malbelopp_modell: ["fast", "intervall", "oppet"],
      media_roll: [
        "cover",
        "gallery",
        "update",
        "result_proof",
        "payout_proof",
      ],
      notis_grupp: [
        "mina_insamlingar",
        "stottat",
        "community",
        "upptack",
        "transaktionellt",
      ],
      notis_kanal: ["in_app", "epost", "push"],
      notis_typ: [
        "insamling_inskickad",
        "granskningsbeslut_godkand",
        "granskningsbeslut_andring",
        "granskningsbeslut_avvisad",
        "donation_mottagen",
        "ny_donation_till_min_insamling",
        "min_insamling_nadde_mal",
        "foljd_insamling_uppdatering",
        "foljd_insamling_resultat",
        "foljd_insamling_utbetald",
        "utbetalningsbesked",
        "refund_verkstalld",
        "badge_tilldelad",
        "paminnelse_resultat_saknas",
        "konto_atgard",
        "sakerhet",
        "system",
      ],
      ordlista_severity: ["hard_block", "soft_flag"],
      overklagande_status: [
        "inkommit",
        "avgjord_uppriven",
        "avgjord_bekraftad",
      ],
      payout_status: ["pending", "in_transit", "paid", "failed", "canceled"],
      reaktion_typ: ["dua", "stod"],
      refund_anledning: [
        "bedrageri",
        "fel_donation",
        "admin_beslut",
        "donator_begaran",
      ],
      refund_status: ["pending", "succeeded", "failed", "canceled"],
      team_aktivitet_typ: [
        "invite_skapad",
        "invite_redeemed",
        "invite_avbruten",
        "roll_befordrad",
        "roll_inaktiverad",
        "roll_aterstalld",
        "totp_aktiverad",
        "totp_aterstalld",
        "login_team",
        "session_invalidated",
        "annat",
      ],
      transfer_status: ["pending", "paid", "reversed", "failed"],
      webhook_event_status: ["received", "processed", "error", "skipped"],
    },
  },
} as const
