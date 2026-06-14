/**
 * GR CLASS — DOCX-to-HTML Certificate Generator
 * Reads extracted certificate text and generates consistent HTML templates
 * matching the GRClass design system from sample_doc/
 */

import fs from 'fs';
import path from 'path';

const EXTRACTED_DIR = path.resolve('extracted_content');
const OUTPUT_DIR = path.resolve('ONLY CERTIFICATES/HTML_OUTPUT');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Certificate Registry ──────────────────────────────────────────────
// Maps each extracted text file → structured metadata for HTML generation
const CERT_REGISTRY = [
  // ── ANTI FOULING SYSTEM ──
  { txtFile: 'AFS-FT.txt', code: 'AFS-FT', term: 'Full Term', certTitle: 'International Anti-Fouling System Certificate', convention: 'Issued under the International Convention on the Control of Harmful Anti-Fouling Systems on Ships (AFS Convention, 2001)', formCode: 'AFSC-FT', certPrefix: 'GRC-AFS', type: 'afs' },
  { txtFile: 'AFS-ST.txt', code: 'AFS-ST', term: 'Short Term', certTitle: 'International Anti-Fouling System Certificate', convention: 'Issued under the International Convention on the Control of Harmful Anti-Fouling Systems on Ships (AFS Convention, 2001)', formCode: 'AFSC-ST', certPrefix: 'GRC-AFS', type: 'afs' },

  // ── BALLAST WATER MANAGEMENT ──
  { txtFile: 'BWM-ST.txt', code: 'BWM-ST', term: 'Short Term', certTitle: 'International Ballast Water Management Certificate', convention: 'Issued under the provisions of the International Convention for the Control and Management of Ships\' Ballast Water and Sediments', formCode: 'BWMC-ST', certPrefix: 'GRC-BWM', type: 'bwm' },

  // ── BOLLARD PULL ──
  { txtFile: 'BPTC.txt', code: 'BPTC', term: 'Full Term', certTitle: 'Bollard Pull Assessment Certificate', convention: 'Issued under the provisions of the relevant international conventions and GR CLASS technical standards', formCode: 'BPA-FT', certPrefix: 'GRC-BPA', type: 'standard' },

  // ── BOTTOM INSPECTION ──
  { txtFile: 'BS-FT.txt', code: 'BS-FT', term: 'Full Term', certTitle: 'Bottom Inspection Certificate', convention: 'Issued under the provisions of the relevant international conventions and GR CLASS technical standards', formCode: 'BI-FT', certPrefix: 'GRC-BI', type: 'standard' },
  { txtFile: 'BS_-_ST.txt', code: 'BS-ST', term: 'Short Term', certTitle: 'Bottom Inspection Certificate', convention: 'Issued under the provisions of the relevant international conventions and GR CLASS technical standards', formCode: 'BI-ST', certPrefix: 'GRC-BI', type: 'standard' },

  // ── CARGO SHIP SAFETY ──
  { txtFile: 'SAFCE-FT.txt', code: 'SAFCE-FT', term: 'Full Term', certTitle: 'Cargo Ship Safety Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSC-FT', certPrefix: 'GRC-CSSC', type: 'standard' },
  { txtFile: 'SAFCE-ST.txt', code: 'SAFCE-ST', term: 'Short Term', certTitle: 'Cargo Ship Safety Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSC-ST', certPrefix: 'GRC-CSSC', type: 'standard' },

  // ── CARGO SHIP SAFETY CONSTRUCTION ──
  { txtFile: 'CCC-FT.txt', code: 'CCC-FT', term: 'Full Term', certTitle: 'Cargo Ship Safety Construction Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSCC-FT', certPrefix: 'GRC-CSSCC', type: 'standard' },
  { txtFile: 'CCC-ST.txt', code: 'CCC-ST', term: 'Short Term', certTitle: 'Cargo Ship Safety Construction Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSCC-ST', certPrefix: 'GRC-CSSCC', type: 'standard' },

  // ── CARGO SHIP SAFETY EQUIPMENT ──
  { txtFile: 'CEC-FT.txt', code: 'CEC-FT', term: 'Full Term', certTitle: 'Cargo Ship Safety Equipment Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSEC-FT', certPrefix: 'GRC-CSSEC', type: 'standard' },
  { txtFile: 'CEC-ST.txt', code: 'CEC-ST', term: 'Short Term', certTitle: 'Cargo Ship Safety Equipment Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSEC-ST', certPrefix: 'GRC-CSSEC', type: 'standard' },

  // ── CARGO SHIP SAFETY RADIO ──
  { txtFile: 'CRC-FT.txt', code: 'CRC-FT', term: 'Full Term', certTitle: 'Cargo Ship Safety Radio Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSRC-FT', certPrefix: 'GRC-CSSRC', type: 'standard' },
  { txtFile: 'CRC-ST.txt', code: 'CRC-ST', term: 'Short Term', certTitle: 'Cargo Ship Safety Radio Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSRC-ST', certPrefix: 'GRC-CSSRC', type: 'standard' },

  // ── CARGO SHIP SAFETY RADIOTELEPHONY ──
  { txtFile: 'SARCE_-FT.txt', code: 'SARCE-FT', term: 'Full Term', certTitle: 'Cargo Ship Safety Radiotelephony Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSRTC-FT', certPrefix: 'GRC-CSSRTC', type: 'standard' },
  { txtFile: 'SARCE-ST.txt', code: 'SARCE-ST', term: 'Short Term', certTitle: 'Cargo Ship Safety Radiotelephony Certificate', convention: 'Issued under the provisions of the International Convention for the Safety of Life at Sea (SOLAS), 1974, as amended', formCode: 'CSSRTC-ST', certPrefix: 'GRC-CSSRTC', type: 'standard' },

  // ── CARIBBEAN CARGO SHIP SAFETY ──
  { txtFile: 'CCSSC-FT.txt', code: 'CCSSC-FT', term: 'Full Term', certTitle: 'Caribbean Cargo Ship Safety Certificate', convention: 'Issued under the provisions of the Caribbean Cargo Ship Safety Code and relevant international conventions', formCode: 'CCSSC-FT', certPrefix: 'GRC-CCSSC', type: 'standard' },
  { txtFile: 'CCSSC-ST.txt', code: 'CCSSC-ST', term: 'Short Term', certTitle: 'Caribbean Cargo Ship Safety Certificate', convention: 'Issued under the provisions of the Caribbean Cargo Ship Safety Code and relevant international conventions', formCode: 'CCSSC-ST', certPrefix: 'GRC-CCSSC', type: 'standard' },

  // ── IMSBC CODE COMPLIANCE ──
  { txtFile: 'IMSBC-FT.txt', code: 'IMSBC-FT', term: 'Full Term', certTitle: 'Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) Code', convention: 'Issued under the provisions of the International Maritime Solid Bulk Cargoes (IMSBC) Code', formCode: 'IMSBC-FT', certPrefix: 'GRC-IMSBC', type: 'standard' },
  { txtFile: 'IMSBC-ST.txt', code: 'IMSBC-ST', term: 'Short Term', certTitle: 'Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) Code', convention: 'Issued under the provisions of the International Maritime Solid Bulk Cargoes (IMSBC) Code', formCode: 'IMSBC-ST', certPrefix: 'GRC-IMSBC', type: 'standard' },

  // ── IBC CODE (Certificate of Fitness - Dangerous Chemicals) ──
  { txtFile: 'IBC-_CERTIFICATE_FT.txt', code: 'IBC-FT', term: 'Full Term', certTitle: 'Certificate of Fitness for the Carriage of Dangerous Chemicals in Bulk', convention: 'Issued under the provisions of the International Code for the Construction and Equipment of Ships Carrying Dangerous Chemicals in Bulk (IBC Code)', formCode: 'IBC-FT', certPrefix: 'GRC-IBC', type: 'standard' },
  { txtFile: 'IBC-CERTIFICATE_ST.txt', code: 'IBC-ST', term: 'Short Term', certTitle: 'Certificate of Fitness for the Carriage of Dangerous Chemicals in Bulk', convention: 'Issued under the provisions of the International Code for the Construction and Equipment of Ships Carrying Dangerous Chemicals in Bulk (IBC Code)', formCode: 'IBC-ST', certPrefix: 'GRC-IBC', type: 'standard' },

  // ── IGC CODE (Certificate of Fitness - Liquefied Gases) ──
  { txtFile: 'IGC_-_FT.txt', code: 'IGC-FT', term: 'Full Term', certTitle: 'Certificate of Fitness for the Carriage of Liquefied Gases in Bulk', convention: 'Issued under the provisions of the International Code for the Construction and Equipment of Ships Carrying Liquefied Gases in Bulk (IGC Code)', formCode: 'IGC-FT', certPrefix: 'GRC-IGC', type: 'standard' },
  { txtFile: 'IGC_-_ST.txt', code: 'IGC-ST', term: 'Short Term', certTitle: 'Certificate of Fitness for the Carriage of Liquefied Gases in Bulk', convention: 'Issued under the provisions of the International Code for the Construction and Equipment of Ships Carrying Liquefied Gases in Bulk (IGC Code)', formCode: 'IGC-ST', certPrefix: 'GRC-IGC', type: 'standard' },

  // ── CICA / OMCA ──
  { txtFile: 'OMCA-FT.txt', code: 'OMCA-FT', term: 'Full Term', certTitle: 'Oil and Maritime Compliance Assurance Certificate', convention: 'Issued under the provisions of the relevant international conventions and GR CLASS technical standards', formCode: 'OMCA-FT', certPrefix: 'GRC-OMCA', type: 'standard' },
  { txtFile: 'OMCA-ST.txt', code: 'OMCA-ST', term: 'Short Term', certTitle: 'Oil and Maritime Compliance Assurance Certificate', convention: 'Issued under the provisions of the relevant international conventions and GR CLASS technical standards', formCode: 'OMCA-ST', certPrefix: 'GRC-OMCA', type: 'standard' },

  // ── DOC (Document of Compliance - ISM) ──
  { txtFile: 'DOC-FT.txt', code: 'DOC-FT', term: 'Full Term', certTitle: 'Document of Compliance', convention: 'Issued under the provisions of the International Safety Management (ISM) Code', formCode: 'DOC-FT', certPrefix: 'GRC-DOC', type: 'standard' },
  { txtFile: 'DOC-ST.txt', code: 'DOC-ST', term: 'Short Term', certTitle: 'Document of Compliance', convention: 'Issued under the provisions of the International Safety Management (ISM) Code', formCode: 'DOC-ST', certPrefix: 'GRC-DOC', type: 'standard' },

  // ── DOCKING SURVEY ──
  { txtFile: 'BS_-_FT.txt', code: 'DS-FT', term: 'Full Term', certTitle: 'Docking Survey Certificate', convention: 'Issued under the provisions of the relevant international conventions and GR CLASS survey requirements', formCode: 'DS-FT', certPrefix: 'GRC-DS', type: 'standard' },
  // NOTE: BS_-_ST.txt is under BOTTOM INSPECTION already - Docking Survey BS-ST maps separately
  
  // ── DOCUMENT OF AUTHORIZATION - CARRIAGE OF GRAIN ──
  { txtFile: 'DOC205891_GRALO-FT.txt', code: 'GRALO-FT', term: 'Full Term', certTitle: 'Document of Authorization for the Carriage of Grain', convention: 'Issued under the provisions of the International Code for the Safe Carriage of Grain in Bulk (International Grain Code)', formCode: 'GRALO-FT', certPrefix: 'GRC-GRALO', type: 'standard' },
  { txtFile: 'DOC205892_GRALO-ST.txt', code: 'GRALO-ST', term: 'Short Term', certTitle: 'Document of Authorization for the Carriage of Grain', convention: 'Issued under the provisions of the International Code for the Safe Carriage of Grain in Bulk (International Grain Code)', formCode: 'GRALO-ST', certPrefix: 'GRC-GRALO', type: 'standard' },

  // ── DOC - DANGEROUS GOODS COMPLIANCE ──
  { txtFile: 'DOC334364_CDG-FT.txt', code: 'CDG-FT', term: 'Full Term', certTitle: 'Document of Compliance with the Special Requirements for Ships Carrying Dangerous Goods', convention: 'Issued under the provisions of SOLAS Chapter II-2, Regulation 19 for ships carrying dangerous goods', formCode: 'CDG-FT', certPrefix: 'GRC-CDG', type: 'standard' },
  { txtFile: 'DOC334377_CDG-ST.txt', code: 'CDG-ST', term: 'Short Term', certTitle: 'Document of Compliance with the Special Requirements for Ships Carrying Dangerous Goods', convention: 'Issued under the provisions of SOLAS Chapter II-2, Regulation 19 for ships carrying dangerous goods', formCode: 'CDG-ST', certPrefix: 'GRC-CDG', type: 'standard' },

  // ── EIAPP ──
  { txtFile: 'EIAPP-FT.txt', code: 'EIAPP-FT', term: 'Full Term', certTitle: 'Engine International Air Pollution Prevention Certificate', convention: 'Issued under the provisions of the Protocol of 1997 to amend MARPOL 73/78, Annex VI — Regulations for the Prevention of Air Pollution from Ships', formCode: 'EIAPP-FT', certPrefix: 'GRC-EIAPP', type: 'standard' },
  { txtFile: 'EIAPP-ST.txt', code: 'EIAPP-ST', term: 'Short Term', certTitle: 'Engine International Air Pollution Prevention Certificate', convention: 'Issued under the provisions of the Protocol of 1997 to amend MARPOL 73/78, Annex VI — Regulations for the Prevention of Air Pollution from Ships', formCode: 'EIAPP-ST', certPrefix: 'GRC-EIAPP', type: 'standard' },

  // ── FISHING VESSEL SAFETY ──
  { txtFile: 'DOC334803_FISVEL-FT.txt', code: 'FISVEL-FT', term: 'Full Term', certTitle: 'Fishing Vessel Safety Certificate', convention: 'Issued under the provisions of the Torremolinos International Convention for the Safety of Fishing Vessels, 1977 and 1993 Protocol', formCode: 'FVSC-FT', certPrefix: 'GRC-FVSC', type: 'standard' },
  { txtFile: 'DOC334810_FISVEL-ST.txt', code: 'FISVEL-ST', term: 'Short Term', certTitle: 'Fishing Vessel Safety Certificate', convention: 'Issued under the provisions of the Torremolinos International Convention for the Safety of Fishing Vessels, 1977 and 1993 Protocol', formCode: 'FVSC-ST', certPrefix: 'GRC-FVSC', type: 'standard' },

  // ── GARBAGE MANAGEMENT ──
  { txtFile: 'GMC-FT.txt', code: 'GMC-FT', term: 'Full Term', certTitle: 'Garbage Management Certificate', convention: 'Issued under the provisions of MARPOL 73/78, Annex V — Prevention of Pollution by Garbage from Ships', formCode: 'GMC-FT', certPrefix: 'GRC-GMC', type: 'standard' },
  { txtFile: 'GMC-ST.txt', code: 'GMC-ST', term: 'Short Term', certTitle: 'Garbage Management Certificate', convention: 'Issued under the provisions of MARPOL 73/78, Annex V — Prevention of Pollution by Garbage from Ships', formCode: 'GMC-ST', certPrefix: 'GRC-GMC', type: 'standard' },

  // ── HIGH SPEED CRAFT ──
  { txtFile: 'HSC_FT.txt', code: 'HSC-FT', term: 'Full Term', certTitle: 'High Speed Craft Safety Certificate', convention: 'Issued under the provisions of the International Code of Safety for High-Speed Craft (HSC Code)', formCode: 'HSC-FT', certPrefix: 'GRC-HSC', type: 'standard' },
  { txtFile: 'HSC_ST.txt', code: 'HSC-ST', term: 'Short Term', certTitle: 'High Speed Craft Safety Certificate', convention: 'Issued under the provisions of the International Code of Safety for High-Speed Craft (HSC Code)', formCode: 'HSC-ST', certPrefix: 'GRC-HSC', type: 'standard' },

  // ── IAPP ──
  { txtFile: 'IAPP-_CERTIFICATE_FT.txt', code: 'IAPP-FT', term: 'Full Term', certTitle: 'International Air Pollution Prevention Certificate', convention: 'Issued under the provisions of the Protocol of 1997 to amend MARPOL 73/78, Annex VI — Prevention of Air Pollution from Ships', formCode: 'IAPP-FT', certPrefix: 'GRC-IAPP', type: 'standard' },
  { txtFile: 'IAPP-ST_CONDITIONAL.txt', code: 'IAPP-ST', term: 'Short Term (Conditional)', certTitle: 'International Air Pollution Prevention Certificate', convention: 'Issued under the provisions of the Protocol of 1997 to amend MARPOL 73/78, Annex VI — Prevention of Air Pollution from Ships', formCode: 'IAPP-ST', certPrefix: 'GRC-IAPP', type: 'standard' },

  // ── BCH (Int. Certificate of Fitness - Dangerous Chemicals) ──
  { txtFile: 'BCH-FT.txt', code: 'BCH-FT', term: 'Full Term', certTitle: 'International Certificate of Fitness for the Carriage of Dangerous Chemicals in Bulk', convention: 'Issued under the provisions of the Code for the Construction and Equipment of Ships Carrying Dangerous Chemicals in Bulk (BCH Code)', formCode: 'BCH-FT', certPrefix: 'GRC-BCH', type: 'standard' },
  { txtFile: 'BCH-ST.txt', code: 'BCH-ST', term: 'Short Term', certTitle: 'International Certificate of Fitness for the Carriage of Dangerous Chemicals in Bulk', convention: 'Issued under the provisions of the Code for the Construction and Equipment of Ships Carrying Dangerous Chemicals in Bulk (BCH Code)', formCode: 'BCH-ST', certPrefix: 'GRC-BCH', type: 'standard' },

  // ── IOPP ──
  { txtFile: 'IOPP-_FT.txt', code: 'IOPP-FT', term: 'Full Term', certTitle: 'International Oil Pollution Prevention Certificate', convention: 'Issued under the provisions of MARPOL 73/78, Annex I — Prevention of Pollution by Oil', formCode: 'IOPPC-FT', certPrefix: 'GRC-IOPP', type: 'standard' },
  { txtFile: 'IOPP-_ST.txt', code: 'IOPP-ST', term: 'Short Term', certTitle: 'International Oil Pollution Prevention Certificate', convention: 'Issued under the provisions of MARPOL 73/78, Annex I — Prevention of Pollution by Oil', formCode: 'IOPPC-ST', certPrefix: 'GRC-IOPP', type: 'standard' },

  // ── NLS (Noxious Liquid Substances) ──
  { txtFile: 'NLS-FT.txt', code: 'NLS-FT', term: 'Full Term', certTitle: 'International Pollution Prevention Certificate for the Carriage of Noxious Liquid Substances in Bulk', convention: 'Issued under the provisions of MARPOL 73/78, Annex II — Control of Pollution by Noxious Liquid Substances in Bulk', formCode: 'NLS-FT', certPrefix: 'GRC-NLS', type: 'standard' },
  { txtFile: 'NLS-ST.txt', code: 'NLS-ST', term: 'Short Term', certTitle: 'International Pollution Prevention Certificate for the Carriage of Noxious Liquid Substances in Bulk', convention: 'Issued under the provisions of MARPOL 73/78, Annex II — Control of Pollution by Noxious Liquid Substances in Bulk', formCode: 'NLS-ST', certPrefix: 'GRC-NLS', type: 'standard' },

  // ── ISPP ──
  { txtFile: 'ISPP-FT.txt', code: 'ISPP-FT', term: 'Full Term', certTitle: 'International Sewage Pollution Prevention Certificate', convention: 'Issued under the provisions of MARPOL 73/78, Annex IV — Prevention of Pollution by Sewage from Ships', formCode: 'ISPP-FT', certPrefix: 'GRC-ISPP', type: 'standard' },
  { txtFile: 'ISPP-ST.txt', code: 'ISPP-ST', term: 'Short Term', certTitle: 'International Sewage Pollution Prevention Certificate', convention: 'Issued under the provisions of MARPOL 73/78, Annex IV — Prevention of Pollution by Sewage from Ships', formCode: 'ISPP-ST', certPrefix: 'GRC-ISPP', type: 'standard' },

  // ── ISSC ──
  { txtFile: 'ISSC_FT.txt', code: 'ISSC-FT', term: 'Full Term', certTitle: 'International Ship Security Certificate', convention: 'Issued under the provisions of the International Ship and Port Facility Security (ISPS) Code', formCode: 'ISSC-FT', certPrefix: 'GRC-ISSC', type: 'standard' },
  { txtFile: 'ISSC_ST.txt', code: 'ISSC-ST', term: 'Short Term', certTitle: 'International Ship Security Certificate', convention: 'Issued under the provisions of the International Ship and Port Facility Security (ISPS) Code', formCode: 'ISSC-ST', certPrefix: 'GRC-ISSC', type: 'standard' },

  // ── LL (Load Line) ──
  { txtFile: 'LL_FT.txt', code: 'LL-FT', term: 'Full Term', certTitle: 'International Load Line Certificate', convention: 'Issued under the provisions of the International Convention on Load Lines, 1966 (as amended by the 1988 Protocol)', formCode: 'LLC-FT', certPrefix: 'GRC-LL', type: 'standard' },
  { txtFile: 'LL_ST.txt', code: 'LL-ST', term: 'Short Term', certTitle: 'International Load Line Certificate', convention: 'Issued under the provisions of the International Convention on Load Lines, 1966 (as amended by the 1988 Protocol)', formCode: 'LLC-ST', certPrefix: 'GRC-LL', type: 'standard' },

  // ── MLC ──
  { txtFile: 'MLC_FT.txt', code: 'MLC-FT', term: 'Full Term', certTitle: 'Maritime Labour Certificate', convention: 'Issued under the provisions of the Maritime Labour Convention (MLC), 2006', formCode: 'MLC-FT', certPrefix: 'GRC-MLC', type: 'standard' },
  { txtFile: 'MLC_ST.txt', code: 'MLC-ST', term: 'Short Term', certTitle: 'Maritime Labour Certificate', convention: 'Issued under the provisions of the Maritime Labour Convention (MLC), 2006', formCode: 'MLC-ST', certPrefix: 'GRC-MLC', type: 'standard' },

  // ── MODU ──
  { txtFile: 'MODU_2009_FT.txt', code: 'MODU-FT', term: 'Full Term', certTitle: 'Mobile Offshore Drilling Unit Safety Certificate', convention: 'Issued under the provisions of the Code for the Construction and Equipment of Mobile Offshore Drilling Units (MODU Code), 2009', formCode: 'MODU-FT', certPrefix: 'GRC-MODU', type: 'standard' },
  { txtFile: 'MODU_2009_ST.txt', code: 'MODU-ST', term: 'Short Term', certTitle: 'Mobile Offshore Drilling Unit Safety Certificate', convention: 'Issued under the provisions of the Code for the Construction and Equipment of Mobile Offshore Drilling Units (MODU Code), 2009', formCode: 'MODU-ST', certPrefix: 'GRC-MODU', type: 'standard' },

  // ── NATIONAL TONNAGE ──
  { txtFile: 'TON_ST.txt', code: 'TON-ST', term: 'Short Term', certTitle: 'National Tonnage Certificate (Vessel Under 24m)', convention: 'Issued under the provisions of the national tonnage measurement regulations for vessels under 24 metres in length', formCode: 'NTC-ST', certPrefix: 'GRC-NTC', type: 'standard' },

  // ── PLEASURE CRAFT SAFETY ──
  { txtFile: 'PLECE_FT.txt', code: 'PLECE-FT', term: 'Full Term', certTitle: 'Pleasure Craft Safety Certificate', convention: 'Issued under the provisions of the relevant national regulations and GR CLASS technical standards for pleasure craft', formCode: 'PCSC-FT', certPrefix: 'GRC-PCSC', type: 'standard' },
  { txtFile: 'PLECE_ST.txt', code: 'PLECE-ST', term: 'Short Term', certTitle: 'Pleasure Craft Safety Certificate', convention: 'Issued under the provisions of the relevant national regulations and GR CLASS technical standards for pleasure craft', formCode: 'PCSC-ST', certPrefix: 'GRC-PCSC', type: 'standard' },

  // ── SEA WORTHINESS ──
  { txtFile: null, code: 'SWC-FT', term: 'Full Term', certTitle: 'Sea Worthiness Certificate', convention: 'Issued under the provisions of the relevant international conventions and national regulations for seaworthiness of vessels', formCode: 'SWC-FT', certPrefix: 'GRC-SWC', type: 'standard', folder: 'Sea Worthiness Certificate' },
  { txtFile: null, code: 'SWC-ST', term: 'Short Term', certTitle: 'Sea Worthiness Certificate', convention: 'Issued under the provisions of the relevant international conventions and national regulations for seaworthiness of vessels', formCode: 'SWC-ST', certPrefix: 'GRC-SWC', type: 'standard', folder: 'Sea Worthiness Certificate' },

  // ── SMC (Safety Management Certificate) ──
  { txtFile: null, code: 'SMC-FT', term: 'Full Term', certTitle: 'Safety Management Certificate', convention: 'Issued under the provisions of the International Safety Management (ISM) Code, SOLAS Chapter IX', formCode: 'SMC-FT', certPrefix: 'GRC-SMC', type: 'standard', folder: 'SMC' },
  { txtFile: null, code: 'SMC-ST', term: 'Short Term', certTitle: 'Safety Management Certificate', convention: 'Issued under the provisions of the International Safety Management (ISM) Code, SOLAS Chapter IX', formCode: 'SMC-ST', certPrefix: 'GRC-SMC', type: 'standard', folder: 'SMC' },

  // ── SPS ──
  { txtFile: 'SPS_FT.txt', code: 'SPS-FT', term: 'Full Term', certTitle: 'Special Purpose Ship Safety Certificate', convention: 'Issued under the provisions of the Code of Safety for Special Purpose Ships (SPS Code)', formCode: 'SPS-FT', certPrefix: 'GRC-SPS', type: 'standard' },
  { txtFile: 'SPSST.txt', code: 'SPS-ST', term: 'Short Term', certTitle: 'Special Purpose Ship Safety Certificate', convention: 'Issued under the provisions of the Code of Safety for Special Purpose Ships (SPS Code)', formCode: 'SPS-ST', certPrefix: 'GRC-SPS', type: 'standard' },

  // ── IHM (Statement of Compliance) ──
  { txtFile: 'IHM_FT_-_Supplement_Part_I.txt', code: 'IHM-FT', term: 'Full Term', certTitle: 'Statement of Compliance — International Certificate on Inventory of Hazardous Materials', convention: 'Issued under the provisions of the Hong Kong International Convention for the Safe and Environmentally Sound Recycling of Ships, 2009 and EU Regulation No 1257/2013', formCode: 'IHM-FT', certPrefix: 'GRC-IHM', type: 'standard' },
  { txtFile: 'Nigeria_IHM_SOC_FT.txt', code: 'IHM-SOC-FT', term: 'Full Term', certTitle: 'Statement of Compliance — IHM (Nigeria)', convention: 'Issued under the provisions of the Hong Kong International Convention for the Safe and Environmentally Sound Recycling of Ships, 2009 (Nigeria Registry)', formCode: 'IHM-SOC-FT', certPrefix: 'GRC-IHM', type: 'standard' },
];

// ─── CSS Design System (shared across all certificates) ────────────────
const CSS = `@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

:root {
  --navy:    #0B2443;
  --blue:    #005BAA;
  --gold:    #B5891F;
  --gold-lt: #D4A93A;
  --cream:   #F9F6F0;
  --light:   #EEF3F9;
  --border:  #C8D8E8;
  --rule:    #C4A84A;
  --text:    #18181B;
  --muted:   #52525B;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { background: #8A8A8A; }
body {
  font-family: 'Source Sans 3', sans-serif;
  font-size: 10pt;
  color: var(--text);
  background: #8A8A8A;
  padding: 16px 0 40px;
}

/* ── PRINT BUTTON ── */
.no-print {
  width: 210mm;
  margin: 0 auto 10px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-print {
  background: var(--navy);
  color: #fff;
  border: none;
  padding: 8px 20px;
  font-size: 9pt;
  font-weight: 600;
  letter-spacing: .4px;
  cursor: pointer;
  border-radius: 3px;
}
.btn-print:hover { background: var(--blue); }
.tag-hint {
  font-size: 8pt;
  color: #aaa;
  margin-left: 12px;
}

/* ── CERTIFICATE PAGE ── */
.cert {
  width: 210mm;
  min-height: 297mm;
  background: #fff;
  margin: 0 auto;
  box-shadow: 0 8px 48px rgba(0,0,0,.35);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* prevent any text from overflowing */
.cert * { word-wrap: break-word; overflow-wrap: break-word; }

/* outer decorative frame */
.cert::before {
  content: '';
  position: absolute;
  inset: 5mm;
  border: 1px solid var(--rule);
  pointer-events: none;
  z-index: 5;
}
.cert::after {
  content: '';
  position: absolute;
  inset: 7mm;
  border: .4px solid rgba(196,168,74,.4);
  pointer-events: none;
  z-index: 5;
}

/* ══════════════ HEADER ══════════════ */
.hdr {
  background: var(--navy);
  padding: 0;
  position: relative;
  flex-shrink: 0;
}
.hdr-gold-top {
  height: 4px;
  background: linear-gradient(90deg, #7A5C0F 0%, var(--gold-lt) 35%, #F0C84A 50%, var(--gold-lt) 65%, #7A5C0F 100%);
}
.hdr-inner {
  padding: 8mm 12mm 7mm;
  display: grid;
  grid-template-columns: 60px 1fr minmax(110px, 160px);
  gap: 12px;
  align-items: center;
}
.hdr-gold-bottom {
  height: 2.5px;
  background: linear-gradient(90deg, #7A5C0F 0%, var(--gold-lt) 35%, #F0C84A 50%, var(--gold-lt) 65%, #7A5C0F 100%);
}

/* logo */
.logo {
  width: 60px; height: 60px;
  background: #fff;
  border-radius: 2px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(196,168,74,.6);
}
.logo-gr {
  font-family: 'EB Garamond', serif;
  font-weight: 700;
  font-size: 18pt;
  color: var(--navy);
  line-height: 1;
  letter-spacing: 1px;
}
.logo-word {
  font-size: 5.5pt;
  font-weight: 700;
  color: var(--blue);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

/* centre title */
.hdr-title {}
.hdr-eyebrow {
  font-size: 7pt;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--gold-lt);
  margin-bottom: 4px;
}
.hdr-certname {
  font-family: 'EB Garamond', serif;
  font-size: 14pt;
  font-weight: 700;
  color: #fff;
  line-height: 1.15;
  margin-bottom: 5px;
  word-wrap: break-word;
}
.hdr-convention {
  font-size: 7.5pt;
  color: rgba(255,255,255,.55);
  line-height: 1.5;
  max-width: 440px;
  word-wrap: break-word;
}

/* right meta */
.hdr-meta { text-align: right; word-wrap: break-word; }
.hdr-meta-label {
  font-size: 6pt;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--gold-lt);
  display: block;
}
.hdr-meta-no {
  font-family: 'EB Garamond', serif;
  font-size: 13pt;
  font-weight: 700;
  color: #fff;
  display: block;
  line-height: 1.15;
  letter-spacing: .5px;
  word-wrap: break-word;
  word-break: break-all;
}
.hdr-meta-form {
  font-size: 6.5pt;
  color: rgba(255,255,255,.35);
  margin-top: 4px;
}

/* ══════════════ AUTHORITY BAND ══════════════ */
.authority {
  background: var(--light);
  border-bottom: 1px solid var(--border);
  padding: 3.5mm 12mm;
  text-align: center;
  font-size: 8.5pt;
  color: var(--muted);
  line-height: 1.6;
}
.authority strong { color: var(--navy); font-weight: 700; }

/* ══════════════ BODY ══════════════ */
.body { padding: 4mm 12mm 4mm; flex: 1; }

/* section label */
.sec-label {
  font-size: 6.5pt;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--blue);
  padding-bottom: 2.5px;
  border-bottom: 1.5px solid var(--rule);
  margin: 4mm 0 2.5mm;
}

/* ── VESSEL TABLE ── */
.vtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  margin-bottom: 1mm;
  table-layout: fixed;
}
.vtable th {
  background: var(--navy);
  color: var(--gold-lt);
  font-size: 6.5pt;
  font-weight: 700;
  letter-spacing: .8px;
  text-transform: uppercase;
  padding: 5px 9px;
  border: 1px solid var(--navy);
  text-align: left;
  overflow: hidden;
}
.vtable td {
  padding: 6px 9px;
  border: 1px solid var(--border);
  background: #fff;
  vertical-align: middle;
  overflow: hidden;
}
.vtable .val {
  font-family: 'EB Garamond', serif;
  font-size: 12pt;
  font-weight: 600;
  color: var(--navy);
  line-height: 1.2;
  word-break: break-word;
}
.vtable .sub {
  font-size: 7pt;
  color: var(--muted);
  font-family: 'Source Sans 3', sans-serif;
  font-weight: 400;
  display: block;
  margin-top: 1px;
}
.vtable tr:nth-child(even) td { background: #FAFCFF; }

/* ── EXTRA DATA TABLE ── */
.mtable {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  margin-bottom: 1mm;
}
.mtable th {
  background: var(--light);
  color: var(--navy);
  font-size: 7pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  padding: 6px 9px;
  border: 1px solid var(--border);
  text-align: left;
}
.mtable td {
  padding: 6px 9px;
  border: 1px solid var(--border);
  background: #fff;
}
.mtable .m-val {
  font-family: 'EB Garamond', serif;
  font-size: 11pt;
  font-weight: 600;
  color: var(--text);
}

/* ── CHECKBOX LIST ── */
.chk-list { display: flex; flex-direction: column; gap: 2.5px; margin-bottom: 2mm; }
.chk-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 5.5px 9px;
  border: 1px solid var(--border);
  border-radius: 1px;
  font-size: 9pt;
  line-height: 1.5;
  background: #fff;
  color: var(--muted);
}
.chk-item.checked {
  border-color: var(--blue);
  background: var(--light);
  color: var(--text);
}
.chk-item.checked .chk-text { color: var(--text); }
.checkbox {
  width: 13px; height: 13px;
  border: 1.5px solid #aaa;
  border-radius: 1px;
  flex-shrink: 0;
  margin-top: 1.5px;
  background: #fff;
  position: relative;
}
.chk-item.checked .checkbox {
  background: var(--blue);
  border-color: var(--blue);
}
.chk-item.checked .checkbox::after {
  content: '';
  position: absolute;
  left: 2.5px; top: .5px;
  width: 5px; height: 9px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(38deg);
}
.chk-text b { color: var(--navy); }
.inline-val {
  display: inline-block;
  font-family: 'EB Garamond', serif;
  font-size: 10.5pt;
  font-weight: 600;
  color: var(--navy);
  border-bottom: 1px solid var(--navy);
  padding: 0 4px;
  min-width: 100px;
  line-height: 1.2;
  vertical-align: bottom;
}

/* ── CERTIFY BOX ── */
.certify {
  border-left: 3.5px solid var(--gold);
  background: var(--light);
  padding: 5px 11px 6px;
  margin: 1mm 0 3mm;
  font-size: 9pt;
  line-height: 1.6;
}
.certify-title {
  font-weight: 700;
  color: var(--navy);
  font-size: 9pt;
  margin-bottom: 3px;
  text-transform: uppercase;
  letter-spacing: .5px;
}
.certify ul { margin-left: 16px; color: var(--muted); }
.certify ul li { margin-bottom: 1px; }

/* description text */
.cert-desc {
  font-size: 9pt;
  line-height: 1.6;
  color: var(--muted);
  margin-bottom: 2mm;
}

/* ── VALIDITY GRID ── */
.vgrid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2.5mm;
  margin-bottom: 2.5mm;
}
.vgrid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5mm;
  margin-bottom: 2mm;
}
.vcell {
  border: 1px solid var(--border);
  padding: 5.5px 9px;
  background: #fff;
}
.vcell.hi {
  border-color: var(--blue);
  background: var(--light);
}
.vc-label {
  font-size: 6pt;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--muted);
  display: block;
  margin-bottom: 3px;
}
.vc-val {
  font-family: 'EB Garamond', serif;
  font-size: 12.5pt;
  font-weight: 600;
  color: var(--navy);
  line-height: 1.2;
}
.vcell.hi .vc-val { color: var(--blue); }

/* ── FOOTNOTES ── */
.footnotes {
  border-top: 1px solid var(--border);
  padding: 3mm 0 2mm;
  font-size: 7pt;
  color: var(--muted);
  line-height: 1.65;
}
.footnotes p { margin-bottom: 1.5px; }
sup { color: var(--blue); font-weight: 700; font-size: 6.5pt; }

/* ══════════════ FOOTER ══════════════ */
.ftr {
  background: var(--navy);
  flex-shrink: 0;
  position: relative;
}
.ftr-gold-top {
  height: 2.5px;
  background: linear-gradient(90deg, #7A5C0F 0%, var(--gold-lt) 35%, #F0C84A 50%, var(--gold-lt) 65%, #7A5C0F 100%);
}
.ftr-inner {
  padding: 5.5mm 12mm 6mm;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12mm;
  align-items: end;
}
.sig-area { color: #fff; }
.sig-line {
  border-bottom: 1px solid rgba(255,255,255,.3);
  height: 24px;
  margin-bottom: 5px;
  width: 160px;
}
.sig-label {
  font-size: 6pt;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,.45);
  margin-bottom: 2px;
}
.sig-name {
  font-family: 'EB Garamond', serif;
  font-size: 12pt;
  color: rgba(255,255,255,.9);
  font-style: italic;
  line-height: 1.2;
}
.sig-desig {
  font-size: 7.5pt;
  font-weight: 600;
  color: var(--gold-lt);
  letter-spacing: .3px;
  margin-top: 1px;
}
.ftr-contact {
  text-align: right;
  font-size: 7pt;
  color: rgba(255,255,255,.45);
  line-height: 1.8;
}
.ftr-contact strong {
  display: block;
  color: var(--gold-lt);
  font-size: 8.5pt;
  font-weight: 700;
  letter-spacing: .5px;
  margin-bottom: 2px;
}
.ftr-contact a { color: rgba(255,255,255,.55); text-decoration: none; }

/* ══════════════ PRINT ══════════════ */
@page { size: A4; margin: 0; }
@media print {
  html, body { background: none !important; padding: 0 !important; margin: 0 !important; }
  .no-print { display: none !important; }
  .cert {
    margin: 0;
    box-shadow: none;
    width: 210mm;
    min-height: 297mm;
    overflow: hidden;
    page-break-inside: avoid;
  }
}`;

// ─── HTML Template Functions ───────────────────────────────────────────

function generateHeader(cert) {
  return `  <!-- ═══ HEADER ═══ -->
  <div class="hdr">
    <div class="hdr-gold-top"></div>
    <div class="hdr-inner">

      <div class="logo">
        <span class="logo-gr">GR</span>
        <span class="logo-word">Class</span>
      </div>

      <div class="hdr-title">
        <div class="hdr-eyebrow">{certificate_term}</div>
        <div class="hdr-certname">${cert.certTitle}</div>
        <div class="hdr-convention">
          ${cert.convention}
        </div>
      </div>

      <div class="hdr-meta">
        <span class="hdr-meta-label">${cert.code} No.</span>
        <span class="hdr-meta-no">{certificate_number}</span>
        <div class="hdr-meta-form">Form ${cert.formCode} · Approved by: GM</div>
      </div>

    </div>
    <div class="hdr-gold-bottom"></div>
  </div>`;
}

function generateAuthority() {
  return `  <!-- ═══ AUTHORITY BAND ═══ -->
  <div class="authority">
    Issued under the authority of the Government of <strong>{flag_state}</strong><br>
    By <strong>GR CLASS</strong> — Classified for Standard (GR CLASS) · Recognized Organization (RO) operating under IMO Framework
  </div>`;
}

function generateVesselParticulars() {
  return `    <!-- VESSEL PARTICULARS -->
    <div class="sec-label">Vessel Particulars</div>
    <table class="vtable">
      <tr>
        <th style="width:25%">Name of Ship</th>
        <th style="width:25%">Distinctive No. / Letters</th>
        <th style="width:25%">Port of Registry</th>
        <th style="width:25%">Gross Tonnage</th>
      </tr>
      <tr>
        <td><span class="val">{vessel_name}</span></td>
        <td><span class="val">{call_sign}</span></td>
        <td><span class="val">{port_of_registry}</span></td>
        <td><span class="val">{gross_tonnage}</span></td>
      </tr>
      <tr>
        <th>IMO Number <sup>1</sup></th>
        <th>Ship Type</th>
        <th>Net Tonnage</th>
        <th>Deadweight</th>
      </tr>
      <tr>
        <td><span class="val">{imo_number}</span></td>
        <td><span class="val">{ship_type}</span></td>
        <td><span class="val">{net_tonnage}</span></td>
        <td><span class="val">{deadweight}</span></td>
      </tr>
    </table>`;
}

function generateAFSSection() {
  return `
    <!-- ANTI-FOULING SYSTEM STATUS -->
    <div class="sec-label">Anti-Fouling System Status</div>
    <div class="chk-list">

      <div class="chk-item {afs_option_1_check}">
        <div class="checkbox"></div>
        <div class="chk-text">An anti-fouling system controlled under Annex 1 has <b>not been applied</b> during or after construction of this ship.</div>
      </div>

      <div class="chk-item {afs_option_2_check}">
        <div class="checkbox"></div>
        <div class="chk-text">
          An anti-fouling system controlled under Annex 1 has been applied on this ship previously, but has been
          <b>removed</b> by <span class="inline-val">{facility_name}</span> on <span class="inline-val">{facility_date}</span>
        </div>
      </div>

      <div class="chk-item {afs_option_3_check}">
        <div class="checkbox"></div>
        <div class="chk-text">
          An anti-fouling system controlled under Annex 1 has been applied on this ship previously, but has been
          <b>covered with a sealer coat</b> applied by <span class="inline-val">{facility_name}</span> on <span class="inline-val">{facility_date}</span>
        </div>
      </div>

      <div class="chk-item {afs_option_4_check}">
        <div class="checkbox"></div>
        <div class="chk-text">
          An anti-fouling system controlled under Annex 1 was applied on this ship prior to
          <span class="inline-val">{facility_date}</span>
          but must be removed or covered with a sealer coat prior to
          <span class="inline-val">{compliance_deadline}</span>
        </div>
      </div>

    </div>`;
}

function generateBWMSection() {
  return `
    <!-- BALLAST WATER MANAGEMENT DETAILS -->
    <div class="sec-label">Ballast Water Management Details</div>
    <table class="mtable">
      <tr>
        <th style="width:50%">Method of Ballast Water Management Used</th>
        <th style="width:25%">Date Installed (if applicable)</th>
        <th style="width:25%">Name of Manufacturer (if applicable)</th>
      </tr>
      <tr>
        <td><span class="m-val">{bwm_method}</span></td>
        <td><span class="m-val">{bwm_install_date}</span></td>
        <td><span class="m-val">{bwm_manufacturer}</span></td>
      </tr>
    </table>

    <div class="sec-label" style="margin-top:3mm;">Ballast Water Management Compliance</div>
    <table class="mtable" style="margin-bottom:2mm;">
      <tr>
        <th>Ballast Water Capacity (m³)</th>
      </tr>
      <tr>
        <td><span class="m-val">{ballast_water_capacity}</span></td>
      </tr>
    </table>

    <div class="chk-list">
      <div class="chk-item {bwm_d1_check}">
        <div class="checkbox"></div>
        <div class="chk-text">The principal Ballast Water Management method(s) employed on this ship is/are in accordance with <b>regulation D-1</b></div>
      </div>

      <div class="chk-item {bwm_d2_check}">
        <div class="checkbox"></div>
        <div class="chk-text">
          The principal Ballast Water Management method(s) employed on this ship is/are in accordance with <b>regulation D-2</b> (describe):
          <span class="inline-val">{bwm_d2_description}</span>
        </div>
      </div>

      <div class="chk-item {bwm_d4_check}">
        <div class="checkbox"></div>
        <div class="chk-text">The ship is subject to <b>regulation D-4</b></div>
      </div>
    </div>`;
}

function generateCertifySection(cert) {
  // Read cert text to get specific certification wording
  let certText = '';
  if (cert.txtFile) {
    const txtPath = path.join(EXTRACTED_DIR, cert.txtFile);
    if (fs.existsSync(txtPath)) {
      certText = fs.readFileSync(txtPath, 'utf-8');
    }
  }

  // Extract specific description if available
  const descMatch = certText.match(/This is to certify that the vessel has been surveyed.*?(?=THIS IS TO CERTIFY THAT:)/s);
  const descLine = descMatch ? descMatch[0].trim() : '';

  return `
    <!-- CERTIFICATION -->
    <div class="sec-label">Certification</div>${descLine ? `
    <p class="cert-desc">${descLine}</p>` : ''}
    <div class="certify">
      <div class="certify-title">This is to certify that:</div>
      <ul>
        <li>The ship has been surveyed in accordance with the applicable rules and regulations;</li>
        <li>The survey shows that the structure, equipment, and condition of the ship comply with the safety standards of GR CLASS.</li>
      </ul>
    </div>`;
}

function generateValiditySection() {
  return `
    <!-- DATES & VALIDITY -->
    <div class="sec-label">Dates &amp; Validity</div>
    <div class="vgrid">
      <div class="vcell">
        <span class="vc-label">Survey Completion Date</span>
        <div class="vc-val">{survey_completion_date}</div>
      </div>
      <div class="vcell">
        <span class="vc-label">Date of Issue</span>
        <div class="vc-val">{issue_date}</div>
      </div>
      <div class="vcell hi">
        <span class="vc-label">Valid Until</span>
        <div class="vc-val">{expiry_date}</div>
      </div>
    </div>
    <div class="vgrid-2">
      <div class="vcell">
        <span class="vc-label">Place of Issue</span>
        <div class="vc-val">{place_of_survey}</div>
      </div>
      <div class="vcell">
        <span class="vc-label">Page</span>
        <div class="vc-val">1 of 1</div>
      </div>
    </div>`;
}

function generateFootnotes() {
  return `
    <!-- FOOTNOTES -->
    <div class="footnotes">
      <p><sup>1</sup> In accordance with IMO Ship Identification Number Scheme adopted by the Organization by Resolution A.600(15).</p>
    </div>`;
}

function generateFooter() {
  return `  <!-- ═══ FOOTER / SIGNATURE ═══ -->
  <div class="ftr">
    <div class="ftr-gold-top"></div>
    <div class="ftr-inner">

      <div class="sig-area">
        <div class="sig-line"></div>
        <div class="sig-label">GR CLASS Representative</div>
        <div class="sig-name">{surveyor_name}</div>
        <div class="sig-desig">GR CLASS Representative · Surveyor</div>
      </div>

      <div class="ftr-contact">
        <strong>GR CLASS</strong>
        <a href="mailto:info@grclass.com">info@grclass.com</a><br>
        <a href="https://www.grclass.com">www.grclass.com</a><br>
        Classified for Standard (GR CLASS)<br>
        Recognized Organization · Global Marine Services
      </div>

    </div>
  </div>`;
}

function generateNewTagsComment(cert) {
  const baseTags = ['vessel_name', 'imo_number', 'call_sign', 'port_of_registry', 'gross_tonnage', 'net_tonnage', 'deadweight', 'ship_type', 'certificate_number', 'certificate_term', 'survey_completion_date', 'issue_date', 'expiry_date', 'place_of_survey', 'surveyor_name', 'flag_state'];
  const newTags = [];

  if (cert.type === 'afs') {
    newTags.push('{afs_option_1_check}', '{afs_option_2_check}', '{afs_option_3_check}', '{afs_option_4_check}', '{facility_name}', '{facility_date}', '{compliance_deadline}');
  }
  if (cert.type === 'bwm') {
    newTags.push('{bwm_method}', '{bwm_install_date}', '{bwm_manufacturer}', '{ballast_water_capacity}', '{bwm_d1_check}', '{bwm_d2_check}', '{bwm_d4_check}', '{bwm_d2_description}');
  }

  if (newTags.length > 0) {
    return `\n<!-- NEW TAGS USED: ${newTags.join(', ')} -->`;
  }
  return '';
}

// ─── Main Generator ────────────────────────────────────────────────────

function generateCertHTML(cert) {
  // Build type-specific body sections
  let extraSections = '';
  if (cert.type === 'afs') {
    extraSections = generateAFSSection();
  } else if (cert.type === 'bwm') {
    extraSections = generateBWMSection();
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GR Class – ${cert.code} Certificate</title>
<style>
${CSS}
</style>
</head>
<body>

<div class="no-print">
  <button class="btn-print" onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
  <span class="tag-hint">Tags like {tag} are replaced by software at generation time.</span>
</div>

<div class="cert">

${generateHeader(cert)}

${generateAuthority()}

  <!-- ═══ BODY ═══ -->
  <div class="body">

${generateVesselParticulars()}
${extraSections}
${generateCertifySection(cert)}
${generateValiditySection()}
${generateFootnotes()}

  </div><!-- /body -->

${generateFooter()}

</div><!-- /cert -->
${generateNewTagsComment(cert)}
</body>
</html>
`;
  return html;
}

// ─── Run ───────────────────────────────────────────────────────────────

let generated = 0;
let errors = [];

for (const cert of CERT_REGISTRY) {
  try {
    const html = generateCertHTML(cert);
    const fileName = `GRClass_${cert.code.replace(/-/g, '_')}_Certificate.html`;
    const outPath = path.join(OUTPUT_DIR, fileName);
    fs.writeFileSync(outPath, html);
    console.log(`✓  ${fileName}`);
    generated++;
  } catch (e) {
    errors.push({ code: cert.code, error: e.message });
    console.error(`✗  ${cert.code}: ${e.message}`);
  }
}

console.log(`\n════════════════════════════════════════`);
console.log(`Generated: ${generated} certificates`);
console.log(`Errors: ${errors.length}`);
console.log(`Output: ${OUTPUT_DIR}`);
if (errors.length > 0) {
  console.log(`\nFailed:`);
  errors.forEach(e => console.log(`  - ${e.code}: ${e.error}`));
}
