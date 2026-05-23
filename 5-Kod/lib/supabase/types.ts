// Auto-genererad från Supabase via MCP `generate_typescript_types`.
// Regenerera vid varje schemaändring: kör Supabase MCP-verktyget och
// klistra in resultatet här. Editera ALDRIG handla — överskrivs.
//
// Senast regenererad: 2026-05-23 (efter migration 0010 — granskar-beslut).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
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
      donation: {
        Row: {
          anonym: boolean
          bekraftad: boolean
          belopp_ore: number
          created_at: string
          donator_epost: string
          donator_id: string | null
          enhet_antal: number | null
          frivilligt_bidrag_ore: number
          id: string
          insamling_id: string
          public_id: string
          refunderad: boolean
          refunderad_at: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
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
          frivilligt_bidrag_ore?: number
          id?: string
          insamling_id: string
          public_id?: string
          refunderad?: boolean
          refunderad_at?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
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
          frivilligt_bidrag_ore?: number
          id?: string
          insamling_id?: string
          public_id?: string
          refunderad?: boolean
          refunderad_at?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          undermal_val?: Database["public"]["Enums"]["donation_undermal_val"]
          updated_at?: string
        }
        Relationships: [
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
        ]
      }
      granskning: {
        Row: {
          arende_typ: string
          avgjord_at: string | null
          created_at: string
          eskalerad: boolean
          id: string
          insamling_id: string
          inskickad_at: string
          interna_anteckningar: string | null
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
          id?: string
          insamling_id: string
          inskickad_at?: string
          interna_anteckningar?: string | null
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
          id?: string
          insamling_id?: string
          inskickad_at?: string
          interna_anteckningar?: string | null
          runda?: number
          sla_deadline?: string | null
          tilldelad_granskare_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "granskning_insamling_id_fkey"
            columns: ["insamling_id"]
            isOneToOne: false
            referencedRelation: "insamling"
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
          genomforande_datum: string
          godkand_av: string | null
          hjalp_land: string
          hjalp_lat: number | null
          hjalp_lng: number | null
          hjalp_plats: string | null
          id: string
          insamlar_adress: string | null
          insamlar_adress_publik: boolean
          insamlar_region: string | null
          insamlar_stad: string
          insamlat_ore: number
          insamling_deadline: string
          inskickad_at: string | null
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
          genomforande_datum: string
          godkand_av?: string | null
          hjalp_land: string
          hjalp_lat?: number | null
          hjalp_lng?: number | null
          hjalp_plats?: string | null
          id?: string
          insamlar_adress?: string | null
          insamlar_adress_publik?: boolean
          insamlar_region?: string | null
          insamlar_stad: string
          insamlat_ore?: number
          insamling_deadline: string
          inskickad_at?: string | null
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
          genomforande_datum?: string
          godkand_av?: string | null
          hjalp_land?: string
          hjalp_lat?: number | null
          hjalp_lng?: number | null
          hjalp_plats?: string | null
          id?: string
          insamlar_adress?: string | null
          insamlar_adress_publik?: boolean
          insamlar_region?: string | null
          insamlar_stad?: string
          insamlat_ore?: number
          insamling_deadline?: string
          inskickad_at?: string | null
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
          valuta?: string
        }
        Relationships: [
          {
            foreignKeyName: "insamling_agare_id_fkey"
            columns: ["agare_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      organisation: {
        Row: {
          beskrivning: string
          besoksadress: string | null
          created_at: string
          deleted_at: string | null
          id: string
          katalog_status: string
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
          beskrivning: string
          besoksadress?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          katalog_status?: string
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
          beskrivning?: string
          besoksadress?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          katalog_status?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ar_organisation: boolean
          bankid_verifierad: boolean
          created_at: string
          deleted_at: string | null
          e_post: string
          id: string
          kontofryst: boolean
          ombud_kontakt: string | null
          personnummer_krypterat: string | null
          public_id: string
          roll: Database["public"]["Enums"]["anvandar_roll"]
          stripe_account_id: string | null
          stripe_onboarding_klar: boolean
          updated_at: string
          visningsnamn: string
        }
        Insert: {
          ar_organisation?: boolean
          bankid_verifierad?: boolean
          created_at?: string
          deleted_at?: string | null
          e_post: string
          id: string
          kontofryst?: boolean
          ombud_kontakt?: string | null
          personnummer_krypterat?: string | null
          public_id?: string
          roll?: Database["public"]["Enums"]["anvandar_roll"]
          stripe_account_id?: string | null
          stripe_onboarding_klar?: boolean
          updated_at?: string
          visningsnamn: string
        }
        Update: {
          ar_organisation?: boolean
          bankid_verifierad?: boolean
          created_at?: string
          deleted_at?: string | null
          e_post?: string
          id?: string
          kontofryst?: boolean
          ombud_kontakt?: string | null
          personnummer_krypterat?: string | null
          public_id?: string
          roll?: Database["public"]["Enums"]["anvandar_roll"]
          stripe_account_id?: string | null
          stripe_onboarding_klar?: boolean
          updated_at?: string
          visningsnamn?: string
        }
        Relationships: []
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fatta_granskar_beslut: {
        Args: {
          p_beslut: Database["public"]["Enums"]["granskning_beslut"]
          p_granskning_id: string
          p_motivering: string
        }
        Returns: undefined
      }
      skicka_insamling_for_granskning: {
        Args: { p_insamling_id: string }
        Returns: string
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
      anvandar_roll:
        | "donator"
        | "insamlare"
        | "forening"
        | "granskare"
        | "admin"
      collab_status: "begard" | "godkand" | "avbojd" | "aterkallad"
      collab_typ: "initiativtagare" | "stodjer" | "praktisk_partner"
      donation_undermal_val: "ge_anda" | "aterbetala"
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
      malbelopp_modell: "fast" | "intervall" | "oppet"
      media_roll:
        | "cover"
        | "gallery"
        | "update"
        | "result_proof"
        | "payout_proof"
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
      anvandar_roll: ["donator", "insamlare", "forening", "granskare", "admin"],
      collab_status: ["begard", "godkand", "avbojd", "aterkallad"],
      collab_typ: ["initiativtagare", "stodjer", "praktisk_partner"],
      donation_undermal_val: ["ge_anda", "aterbetala"],
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
      malbelopp_modell: ["fast", "intervall", "oppet"],
      media_roll: [
        "cover",
        "gallery",
        "update",
        "result_proof",
        "payout_proof",
      ],
    },
  },
} as const
