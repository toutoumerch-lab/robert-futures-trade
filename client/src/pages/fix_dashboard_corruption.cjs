const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/noure/Documents/trades/client/src/pages/AdminDashboard.jsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// We want to replace lines 1 to 29 (1-indexed) with the correct content.
// line 1 is index 0.
// We want to keep from index 29 (which is line 30) onwards.
const remainingContent = lines.slice(29).join('\n');

const newHeader = `import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import BrandingManager from '../components/admin/BrandingManager';
import MultiSelect from '../components/common/MultiSelect';
import Toggle from '../components/common/Toggle';
import {
  Image, Building2, DollarSign, Settings, Link2, Wrench,
  Star, Check, X, Zap, Flame, Turtle,
  Users, FileText, GraduationCap, Briefcase, PartyPopper, Palette,
  Monitor, Smartphone, ChevronDown, ChevronRight, Layers, Upload,
  Video, BookOpen, Plus, Trash2, Edit3, ChevronUp, ExternalLink, Clock
} from 'lucide-react';

// ──────────────────── Generic Modal ────────────────────
const Modal = ({ title, onClose, hideHeader, style, children }) => {
  useEffect(() => {
`;

fs.writeFileSync(filePath, newHeader + remainingContent, 'utf8');
console.log('Fixed AdminDashboard.jsx corruption successfully.');
