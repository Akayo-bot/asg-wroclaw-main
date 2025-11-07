"use client"; // если Next.js app router

import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next"; // Not needed, using useI18n instead
import { useAuth } from "../contexts/AuthContext";
import { useBranding } from "../contexts/BrandingContext";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Disclosure } from '@headlessui/react';
import { Menu, X, ChevronDown, User, Settings, LogOut, Target, Crown } from 'lucide-react';
import { gsap } from "gsap";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/contexts/I18nContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const ModernNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useI18n();
    const { user, profile, signOut } = useAuth();
    const { settings } = useBranding();

    // Refs for GSAP animations - EXACT COPY FROM YOUR CODE
    const navRef = useRef<HTMLDivElement>(null);
    const activeElementRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const isAnimatingRef = useRef(false);

    const navItems = [
        {
            label: t('nav.home', 'Home'),
            path: '/',
            description: t('nav.home_desc', 'Go to homepage')
        },
        {
            label: t('nav.games', 'Games'),
            path: '/games',
            description: t('nav.games_desc', 'Browse our airsoft games and events')
        },
        {
            label: t('nav.team', 'Team'),
            path: '/team',
            description: t('nav.team_desc', 'Meet our experienced team members')
        },
        {
            label: t('nav.gallery', 'Gallery'),
            path: '/gallery',
            description: t('nav.gallery_desc', 'View photos from our games and events')
        },
        {
            label: t('nav.articles', 'Articles'),
            path: '/articles',
            description: t('nav.articles_desc', 'Read our latest articles and guides')
        },
        {
            label: t('nav.contacts', 'Contacts'),
            path: '/contacts',
            description: t('nav.contacts_desc', 'Get in touch with us')
        },
    ];

    const [activeIndex, setActiveIndex] = useState(() => {
        const currentPath = location.pathname;
        const index = navItems.findIndex(item => {
            if (item.path === '/' && currentPath === '/') return true;
            return currentPath.startsWith(item.path) && item.path !== '/';
        });
        return index >= 0 ? index : 0;
    });

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        return location.pathname.startsWith(path) && path !== '/';
    };

    // Update active index when route changes
    useEffect(() => {
        const currentPath = location.pathname;
        const index = navItems.findIndex(item => {
            if (item.path === '/' && currentPath === '/') return true;
            return currentPath.startsWith(item.path) && item.path !== '/';
        });
        if (index >= 0 && index !== activeIndex) {
            setActiveIndex(index);
        }
    }, [location.pathname, activeIndex, navItems]);

    // EXACT COPY OF YOUR createSVG FUNCTION WITH GREEN COLOR
    const createSVG = (element: HTMLDivElement) => {
        const color = "#4CAF50"; // Green color as requested
        element.innerHTML = `
    <svg viewBox="0 0 116 5" preserveAspectRatio="none" class="beam">
      <path d="M0.5 2.5L113 0.534929C114.099 0.515738 115 1.40113 115 2.5C115 3.59887 114.099 4.48426 113 4.46507L0.5 2.5Z" fill="url(#gradient-beam)"/>
      <defs>
        <linearGradient id="gradient-beam" x1="2" y1="2.5" x2="115" y2="2.5" gradientUnits="userSpaceOnUse">
          <stop stop-color="${color}"/>
          <stop offset="1" stop-color="white"/>
        </linearGradient>
      </defs>
    </svg>
    <div class="strike">
      <svg viewBox="0 0 114 12" preserveAspectRatio="none">
        <g fill="none" stroke="white" stroke-width="0.75" stroke-linecap="round">
          <path d="M113.5 6.5L109.068 8.9621C109.023 8.98721 108.974 9.00516 108.923 9.01531L106.889 9.42219C106.661 9.46776 106.432 9.35034 106.336 9.1388L104.045 4.0986C104.015 4.03362 104 3.96307 104 3.8917V2.12268C104 1.6898 103.487 1.46145 103.166 1.75103L99.2887 5.24019C99.1188 5.39305 98.867 5.41132 98.6768 5.28457L95.0699 2.87996C94.7881 2.69205 94.4049 2.83291 94.3118 3.15862L92.6148 9.09827C92.5483 9.33084 92.3249 9.48249 92.0843 9.45843L87.7087 9.02087C87.5752 9.00752 87.4419 9.04839 87.3389 9.13428L84.9485 11.1263C84.7128 11.3227 84.3575 11.2625 84.1996 10.9994L81.7602 6.93359C81.617 6.69492 81.3064 6.61913 81.0694 6.76501L75.3165 10.3052C75.1286 10.4209 74.8871 10.3997 74.7223 10.2531L70.6678 6.64917C70.5611 6.55429 70.5 6.41829 70.5 6.27547V1.20711C70.5 1.0745 70.4473 0.947322 70.3536 0.853553L70.2185 0.718508C70.0846 0.584592 69.8865 0.537831 69.7068 0.59772L69.2675 0.744166C68.9149 0.861705 68.8092 1.30924 69.0721 1.57206L69.605 2.10499C69.8157 2.31571 69.7965 2.66281 69.5638 2.84897L67.5 4.5L65.2715 6.28282C65.1083 6.41338 64.8811 6.42866 64.7019 6.32113L60.3621 3.71725C60.153 3.59179 59.8839 3.63546 59.7252 3.8206L57.0401 6.95327C57.0135 6.9843 56.9908 7.01849 56.9725 7.05505L55.2533 10.4934C55.1188 10.7624 54.779 10.8526 54.5287 10.6858L50.7686 8.17907C50.6051 8.07006 50.3929 8.06694 50.2263 8.17109L46.7094 10.3691C46.5774 10.4516 46.4145 10.468 46.2688 10.4133L42.6586 9.05949C42.5558 9.02091 42.4684 8.94951 42.4102 8.85633L40.1248 5.1997C40.0458 5.07323 40.0273 4.91808 40.0745 4.77659L40.6374 3.08777C40.7755 2.67359 40.3536 2.29381 39.9562 2.47447L35.5 4.5L32.2657 5.88613C32.1013 5.95658 31.9118 5.93386 31.7687 5.82656L30.1904 4.64279C30.0699 4.55245 29.9152 4.5212 29.7691 4.55772L26.2009 5.44977C26.0723 5.48193 25.9617 5.56388 25.8934 5.67759L23.1949 10.1752C23.0796 10.3673 22.8507 10.4593 22.6346 10.4003L17.6887 9.05148C17.5674 9.01838 17.463 8.94076 17.3963 8.83409L15.3331 5.53299C15.1627 5.26032 14.7829 5.21707 14.5556 5.44443L12.1464 7.85355C12.0527 7.94732 11.9255 8 11.7929 8H8.15139C8.05268 8 7.95617 7.97078 7.87404 7.91603L3.74143 5.16095C3.59214 5.06142 3.40096 5.04952 3.24047 5.12976L0.5 6.5" />
          <path d="M113.5 6.5L109.068 8.9621C109.023 8.98721 108.974 9.00516 108.923 9.01531L106.889 9.42219C106.661 9.46776 106.432 9.35034 106.336 9.1388L104.045 4.0986C104.015 4.03362 104 3.96307 104 3.8917V2.12268C104 1.6898 103.487 1.46145 103.166 1.75103L99.2887 5.24019C99.1188 5.39305 98.867 5.41132 98.6768 5.28457L95.0699 2.87996C94.7881 2.69205 94.4049 2.83291 94.3118 3.15862L92.6148 9.09827C92.5483 9.33084 92.3249 9.48249 92.0843 9.45843L87.7087 9.02087C87.5752 9.00752 87.4419 9.04839 87.3389 9.13428L84.9485 11.1263C84.7128 11.3227 84.3575 11.2625 84.1996 10.9994L81.7602 6.93359C81.617 6.69492 81.3064 6.61913 81.0694 6.76501L75.3165 10.3052C75.1286 10.4209 74.8871 10.3997 74.7223 10.2531L70.6678 6.64917C70.5611 6.55429 70.5 6.41829 70.5 6.27547V1.20711C70.5 1.0745 70.4473 0.947322 70.3536 0.853553L70.2185 0.718508C70.0846 0.584592 69.8865 0.537831 69.7068 0.59772L69.2675 0.744166C68.9149 0.861705 68.8092 1.30924 69.0721 1.57206L69.605 2.10499C69.8157 2.31571 69.7965 2.66281 69.5638 2.84897L67.5 4.5L65.2715 6.28282C65.1083 6.41338 64.8811 6.42866 64.7019 6.32113L60.3621 3.71725C60.153 3.59179 59.8839 3.63546 59.7252 3.8206L57.0401 6.95327C57.0135 6.9843 56.9908 7.01849 56.9725 7.05505L55.2533 10.4934C55.1188 10.7624 54.779 10.8526 54.5287 10.6858L50.7686 8.17907C50.6051 8.07006 50.3929 8.06694 50.2263 8.17109L46.7094 10.3691C46.5774 10.4516 46.4145 10.468 46.2688 10.4133L42.6586 9.05949C42.5558 9.02091 42.4684 8.94951 42.4102 8.85633L40.1248 5.1997C40.0458 5.07323 40.0273 4.91808 40.0745 4.77659L40.6374 3.08777C40.7755 2.67359 40.3536 2.29381 39.9562 2.47447L35.5 4.5L32.2657 5.88613C32.1013 5.95658 31.9118 5.93386 31.7687 5.82656L30.1904 4.64279C30.0699 4.55245 29.9152 4.5212 29.7691 4.55772L26.2009 5.44977C26.0723 5.48193 25.9617 5.56388 25.8934 5.67759L23.1949 10.1752C23.0796 10.3673 22.8507 10.4593 22.6346 10.4003L17.6887 9.05148C17.5674 9.01838 17.463 8.94076 17.3963 8.83409L15.3331 5.53299C15.1627 5.26032 14.7829 5.21707 14.5556 5.44443L12.1464 7.85355C12.0527 7.94732 11.9255 8 11.7929 8H8.15139C8.05268 8 7.95617 7.97078 7.87404 7.91603L3.74143 5.16095C3.59214 5.06142 3.40096 5.04952 3.24047 5.12976L0.5 6.5" />
          <path d="M113.5 6.5L109.068 8.9621C109.023 8.98721 108.974 9.00516 108.923 9.01531L106.889 9.42219C106.661 9.46776 106.432 9.35034 106.336 9.1388L104.045 4.0986C104.015 4.03362 104 3.96307 104 3.8917V2.12268C104 1.6898 103.487 1.46145 103.166 1.75103L99.2887 5.24019C99.1188 5.39305 98.867 5.41132 98.6768 5.28457L95.0699 2.87996C94.7881 2.69205 94.4049 2.83291 94.3118 3.15862L92.6148 9.09827C92.5483 9.33084 92.3249 9.48249 92.0843 9.45843L87.7087 9.02087C87.5752 9.00752 87.4419 9.04839 87.3389 9.13428L84.9485 11.1263C84.7128 11.3227 84.3575 11.2625 84.1996 10.9994L81.7602 6.93359C81.617 6.69492 81.3064 6.61913 81.0694 6.76501L75.3165 10.3052C75.1286 10.4209 74.8871 10.3997 74.7223 10.2531L70.6678 6.64917C70.5611 6.55429 70.5 6.41829 70.5 6.27547V1.20711C70.5 1.0745 70.4473 0.947322 70.3536 0.853553L70.2185 0.718508C70.0846 0.584592 69.8865 0.537831 69.7068 0.59772L69.2675 0.744166C68.9149 0.861705 68.8092 1.30924 69.0721 1.57206L69.605 2.10499C69.8157 2.31571 69.7965 2.66281 69.5638 2.84897L67.5 4.5L65.2715 6.28282C65.1083 6.41338 64.8811 6.42866 64.7019 6.32113L60.3621 3.71725C60.153 3.59179 59.8839 3.63546 59.7252 3.8206L57.0401 6.95327C57.0135 6.9843 56.9908 7.01849 56.9725 7.05505L55.2533 10.4934C55.1188 10.7624 54.779 10.8526 54.5287 10.6858L50.7686 8.17907C50.6051 8.07006 50.3929 8.06694 50.2263 8.17109L46.7094 10.3691C46.5774 10.4516 46.4145 10.468 46.2688 10.4133L42.6586 9.05949C42.5558 9.02091 42.4684 8.94951 42.4102 8.85633L40.1248 5.1997C40.0458 5.07323 40.0273 4.91808 40.0745 4.77659L40.6374 3.08777C40.7755 2.67359 40.3536 2.29381 39.9562 2.47447L35.5 4.5L32.2657 5.88613C32.1013 5.95658 31.9118 5.93386 31.7687 5.82656L30.1904 4.64279C30.0699 4.55245 29.9152 4.5212 29.7691 4.55772L26.2009 5.44977C26.0723 5.48193 25.9617 5.56388 25.8934 5.67759L23.1949 10.1752C23.0796 10.3673 22.8507 10.4593 22.6346 10.4003L17.6887 9.05148C17.5674 9.01838 17.463 8.94076 17.3963 8.83409L15.3331 5.53299C15.1627 5.26032 14.7829 5.21707 14.5556 5.44443L12.1464 7.85355C12.0527 7.94732 11.9255 8 11.7929 8H8.15139C8.05268 8 7.95617 7.97078 7.87404 7.91603L3.74143 5.16095C3.59214 5.06142 3.40096 5.04952 3.24047 5.12976L0.5 6.5" />
        </g>
      </svg>
      <svg viewBox="0 0 114 12" preserveAspectRatio="none">
        <g fill="none" stroke="white" stroke-width="0.75" stroke-linecap="round">
          <path d="M113.5 6.5L109.068 8.9621C109.023 8.98721 108.974 9.00516 108.923 9.01531L106.889 9.42219C106.661 9.46776 106.432 9.35034 106.336 9.1388L104.045 4.0986C104.015 4.03362 104 3.96307 104 3.8917V2.12268C104 1.6898 103.487 1.46145 103.166 1.75103L99.2887 5.24019C99.1188 5.39305 98.867 5.41132 98.6768 5.28457L95.0699 2.87996C94.7881 2.69205 94.4049 2.83291 94.3118 3.15862L92.6148 9.09827C92.5483 9.33084 92.3249 9.48249 92.0843 9.45843L87.7087 9.02087C87.5752 9.00752 87.4419 9.04839 87.3389 9.13428L84.9485 11.1263C84.7128 11.3227 84.3575 11.2625 84.1996 10.9994L81.7602 6.93359C81.617 6.69492 81.3064 6.61913 81.0694 6.76501L75.3165 10.3052C75.1286 10.4209 74.8871 10.3997 74.7223 10.2531L70.6678 6.64917C70.5611 6.55429 70.5 6.41829 70.5 6.27547V1.20711C70.5 1.0745 70.4473 0.947322 70.3536 0.853553L70.2185 0.718508C70.0846 0.584592 69.8865 0.537831 69.7068 0.59772L69.2675 0.744166C68.9149 0.861705 68.8092 1.30924 69.0721 1.57206L69.605 2.10499C69.8157 2.31571 69.7965 2.66281 69.5638 2.84897L67.5 4.5L65.2715 6.28282C65.1083 6.41338 64.8811 6.42866 64.7019 6.32113L60.3621 3.71725C60.153 3.59179 59.8839 3.63546 59.7252 3.8206L57.0401 6.95327C57.0135 6.9843 56.9908 7.01849 56.9725 7.05505L55.2533 10.4934C55.1188 10.7624 54.779 10.8526 54.5287 10.6858L50.7686 8.17907C50.6051 8.07006 50.3929 8.06694 50.2263 8.17109L46.7094 10.3691C46.5774 10.4516 46.4145 10.468 46.2688 10.4133L42.6586 9.05949C42.5558 9.02091 42.4684 8.94951 42.4102 8.85633L40.1248 5.1997C40.0458 5.07323 40.0273 4.91808 40.0745 4.77659L40.6374 3.08777C40.7755 2.67359 40.3536 2.29381 39.9562 2.47447L35.5 4.5L32.2657 5.88613C32.1013 5.95658 31.9118 5.93386 31.7687 5.82656L30.1904 4.64279C30.0699 4.55245 29.9152 4.5212 29.7691 4.55772L26.2009 5.44977C26.0723 5.48193 25.9617 5.56388 25.8934 5.67759L23.1949 10.1752C23.0796 10.3673 22.8507 10.4593 22.6346 10.4003L17.6887 9.05148C17.5674 9.01838 17.463 8.94076 17.3963 8.83409L15.3331 5.53299C15.1627 5.26032 14.7829 5.21707 14.5556 5.44443L12.1464 7.85355C12.0527 7.94732 11.9255 8 11.7929 8H8.15139C8.05268 8 7.95617 7.97078 7.87404 7.91603L3.74143 5.16095C3.59214 5.06142 3.40096 5.04952 3.24047 5.12976L0.5 6.5" />
          <path d="M113.5 6.5L109.068 8.9621C109.023 8.98721 108.974 9.00516 108.923 9.01531L106.889 9.42219C106.661 9.46776 106.432 9.35034 106.336 9.1388L104.045 4.0986C104.015 4.03362 104 3.96307 104 3.8917V2.12268C104 1.6898 103.487 1.46145 103.166 1.75103L99.2887 5.24019C99.1188 5.39305 98.867 5.41132 98.6768 5.28457L95.0699 2.87996C94.7881 2.69205 94.4049 2.83291 94.3118 3.15862L92.6148 9.09827C92.5483 9.33084 92.3249 9.48249 92.0843 9.45843L87.7087 9.02087C87.5752 9.00752 87.4419 9.04839 87.3389 9.13428L84.9485 11.1263C84.7128 11.3227 84.3575 11.2625 84.1996 10.9994L81.7602 6.93359C81.617 6.69492 81.3064 6.61913 81.0694 6.76501L75.3165 10.3052C75.1286 10.4209 74.8871 10.3997 74.7223 10.2531L70.6678 6.64917C70.5611 6.55429 70.5 6.41829 70.5 6.27547V1.20711C70.5 1.0745 70.4473 0.947322 70.3536 0.853553L70.2185 0.718508C70.0846 0.584592 69.8865 0.537831 69.7068 0.59772L69.2675 0.744166C68.9149 0.861705 68.8092 1.30924 69.0721 1.57206L69.605 2.10499C69.8157 2.31571 69.7965 2.66281 69.5638 2.84897L67.5 4.5L65.2715 6.28282C65.1083 6.41338 64.8811 6.42866 64.7019 6.32113L60.3621 3.71725C60.153 3.59179 59.8839 3.63546 59.7252 3.8206L57.0401 6.95327C57.0135 6.9843 56.9908 7.01849 56.9725 7.05505L55.2533 10.4934C55.1188 10.7624 54.779 10.8526 54.5287 10.6858L50.7686 8.17907C50.6051 8.07006 50.3929 8.06694 50.2263 8.17109L46.7094 10.3691C46.5774 10.4516 46.4145 10.468 46.2688 10.4133L42.6586 9.05949C42.5558 9.02091 42.4684 8.94951 42.4102 8.85633L40.1248 5.1997C40.0458 5.07323 40.0273 4.91808 40.0745 4.77659L40.6374 3.08777C40.7755 2.67359 40.3536 2.29381 39.9562 2.47447L35.5 4.5L32.2657 5.88613C32.1013 5.95658 31.9118 5.93386 31.7687 5.82656L30.1904 4.64279C30.0699 4.55245 29.9152 4.5212 29.7691 4.55772L26.2009 5.44977C26.0723 5.48193 25.9617 5.56388 25.8934 5.67759L23.1949 10.1752C23.0796 10.3673 22.8507 10.4593 22.6346 10.4003L17.6887 9.05148C17.5674 9.01838 17.463 8.94076 17.3963 8.83409L15.3331 5.53299C15.1627 5.26032 14.7829 5.21707 14.5556 5.44443L12.1464 7.85355C12.0527 7.94732 11.9255 8 11.7929 8H8.15139C8.05268 8 7.95617 7.97078 7.87404 7.91603L3.74143 5.16095C3.59214 5.06142 3.40096 5.04952 3.24047 5.12976L0.5 6.5" />
          <path d="M113.5 6.5L109.068 8.9621C109.023 8.98721 108.974 9.00516 108.923 9.01531L106.889 9.42219C106.661 9.46776 106.432 9.35034 106.336 9.1388L104.045 4.0986C104.015 4.03362 104 3.96307 104 3.8917V2.12268C104 1.6898 103.487 1.46145 103.166 1.75103L99.2887 5.24019C99.1188 5.39305 98.867 5.41132 98.6768 5.28457L95.0699 2.87996C94.7881 2.69205 94.4049 2.83291 94.3118 3.15862L92.6148 9.09827C92.5483 9.33084 92.3249 9.48249 92.0843 9.45843L87.7087 9.02087C87.5752 9.00752 87.4419 9.04839 87.3389 9.13428L84.9485 11.1263C84.7128 11.3227 84.3575 11.2625 84.1996 10.9994L81.7602 6.93359C81.617 6.69492 81.3064 6.61913 81.0694 6.76501L75.3165 10.3052C75.1286 10.4209 74.8871 10.3997 74.7223 10.2531L70.6678 6.64917C70.5611 6.55429 70.5 6.41829 70.5 6.27547V1.20711C70.5 1.0745 70.4473 0.947322 70.3536 0.853553L70.2185 0.718508C70.0846 0.584592 69.8865 0.537831 69.7068 0.59772L69.2675 0.744166C68.9149 0.861705 68.8092 1.30924 69.0721 1.57206L69.605 2.10499C69.8157 2.31571 69.7965 2.66281 69.5638 2.84897L67.5 4.5L65.2715 6.28282C65.1083 6.41338 64.8811 6.42866 64.7019 6.32113L60.3621 3.71725C60.153 3.59179 59.8839 3.63546 59.7252 3.8206L57.0401 6.95327C57.0135 6.9843 56.9908 7.01849 56.9725 7.05505L55.2533 10.4934C55.1188 10.7624 54.779 10.8526 54.5287 10.6858L50.7686 8.17907C50.6051 8.07006 50.3929 8.06694 50.2263 8.17109L46.7094 10.3691C46.5774 10.4516 46.4145 10.468 46.2688 10.4133L42.6586 9.05949C42.5558 9.02091 42.4684 8.94951 42.4102 8.85633L40.1248 5.1997C40.0458 5.07323 40.0273 4.91808 40.0745 4.77659L40.6374 3.08777C40.7755 2.67359 40.3536 2.29381 39.9562 2.47447L35.5 4.5L32.2657 5.88613C32.1013 5.95658 31.9118 5.93386 31.7687 5.82656L30.1904 4.64279C30.0699 4.55245 29.9152 4.5212 29.7691 4.55772L26.2009 5.44977C26.0723 5.48193 25.9617 5.56388 25.8934 5.67759L23.1949 10.1752C23.0796 10.3673 22.8507 10.4593 22.6346 10.4003L17.6887 9.05148C17.5674 9.01838 17.463 8.94076 17.3963 8.83409L15.3331 5.53299C15.1627 5.26032 14.7829 5.21707 14.5556 5.44443L12.1464 7.85355C12.0527 7.94732 11.9255 8 11.7929 8H8.15139C8.05268 8 7.95617 7.97078 7.87404 7.91603L3.74143 5.16095C3.59214 5.06142 3.40096 5.04952 3.24047 5.12976L0.5 6.5" />
        </g>
      </svg>
    </div>
    `;
    };

    // EXACT COPY OF YOUR getOffsetLeft FUNCTION
    const getOffsetLeft = (element: HTMLButtonElement) => {
        if (!navRef.current || !activeElementRef.current) return 0;
        const elementRect = element.getBoundingClientRect();
        const navRect = navRef.current.getBoundingClientRect();
        const activeElementWidth = activeElementRef.current.offsetWidth;
        return (
            elementRect.left -
            navRect.left +
            (elementRect.width - activeElementWidth) / 2
        );
    };

    // EXACT COPY OF YOUR useLayoutEffect
    useLayoutEffect(() => {
        const btn = buttonRefs.current[activeIndex];
        const el = activeElementRef.current;
        if (navRef.current && el && btn) {
            createSVG(el);
            gsap.set(el, { x: getOffsetLeft(btn) });
            gsap.to(el, { "--active-element-show": "1", "--active-element-opacity": 1, duration: 0.2 });
        }
    }, []); // на первой отрисовке

    // EXACT COPY OF YOUR handleClick FUNCTION
    const handleClick = (index: number) => {
        const navElement = navRef.current;
        const activeElement = activeElementRef.current;
        const oldButton = buttonRefs.current[activeIndex];
        const newButton = buttonRefs.current[index];

        if (index === activeIndex || !navElement || !activeElement || !oldButton || !newButton) return;
        if (isAnimatingRef.current) return; // игнор пока анимация идёт
        isAnimatingRef.current = true;

        const selectedItem = navItems[index]; // путь сохраним, но НЕ навигируем сразу

        const x = getOffsetLeft(newButton);
        const direction = index > activeIndex ? "after" : "before";
        const spacing = Math.abs(x - getOffsetLeft(oldButton));

        navElement.classList.add(direction);

        const tl = gsap.timeline({
            defaults: { ease: "none" },
            onStart: () => {
                createSVG(activeElement);
                gsap.set(activeElement, { rotateY: direction === "before" ? "180deg" : "0deg" });
            },
        });

        tl.to(activeElement, { "--active-element-opacity": 1, duration: 0.1 }, 0);
        tl.to(
            activeElement,
            {
                "--active-element-width": `${spacing > navElement.offsetWidth - 60 ? navElement.offsetWidth - 60 : spacing
                    }px`,
                duration: 0.3,
            },
            0
        );
        tl.to(activeElement, { "--active-element-mask-position": "40%", duration: 0.5 }, 0.15);
        tl.to(activeElement, { "--active-element-opacity": 0, duration: 0.25 }, 0.45);
        tl.to(
            activeElement,
            { "--active-element-scale-x": "0", "--active-element-scale-y": ".25", "--active-element-width": "0px", duration: 0.3 },
            0.3
        );

        // линия едет параллельно
        gsap.to(activeElement, { x, "--active-element-strike-x": "-50%", duration: 0.6, ease: "none" });

        // когда таймлайн закончился — переносим индикатор, чистим DOM и только ПОТОМ навигируем
        tl.eventCallback("onComplete", () => {
            activeElement.innerHTML = "";
            navElement.classList.remove("before", "after");
            gsap.set(activeElement, { x: getOffsetLeft(newButton), "--active-element-show": "1" });

            // можно не вызывать setActiveIndex — он обновится от смены маршрута через useEffect.
            // но если хочешь мгновенно подсветить пункт до навигации, раскомменьтируй:
            // setActiveIndex(index);

            isAnimatingRef.current = false;
            if (selectedItem) navigate(selectedItem.path); // <-- навигация теперь здесь
        });
    };

    return (
        <>
            <style>{`
        .navigation-menu { margin: 20px 0; position: relative; z-index: 1; overflow: visible; }
        .navigation-menu ul { margin: 0; padding: 0; list-style: none; display: flex; gap: 40px; }
        .navigation-menu ul li button {
          appearance: none; border: none; cursor: pointer; background: transparent;
          padding: 0; margin: 0; line-height: 22px;
          transition: color 0.25s;
          color: #fff;
          font-family: "Inter";
          font-weight: 600;
          font-size: 16px;
        }
        .navigation-menu ul li:not(.active):hover button {
          text-shadow: 0 0 10px #4CAF50, 0 0 20px #4CAF50;
        }
        .navigation-menu .active-element {
          --active-element-scale-x: 1;
          --active-element-scale-y: 1;
          --active-element-show: 0;
          --active-element-opacity: 0;
          --active-element-width: 0px;
          --active-element-strike-x: 0%;
          --active-element-mask-position: 0%;
          position: absolute; left: 0; top: 34px; height: 3px; width: 36px;
          border-radius: 2px; background-color: #4CAF50;
          opacity: var(--active-element-show);
          overflow: visible; will-change: transform, opacity;
        }
        .navigation-menu .active-element > svg,
        .navigation-menu .active-element .strike {
          position: absolute; right: 0; top: 50%; transform: translateY(-50%);
          opacity: var(--active-element-opacity);
          width: var(--active-element-width); mix-blend-mode: multiply;
        }
        .navigation-menu .active-element > svg {
          display: block; overflow: visible; height: 5px;
          filter: blur(0.5px) drop-shadow(2px 0px 8px #4CAF5040)
                  drop-shadow(1px 0px 2px #4CAF5080) drop-shadow(0px 0px 3px #4CAF5040)
                  drop-shadow(2px 0px 8px #4CAF5045) drop-shadow(8px 0px 16px #4CAF5050);
        }
        .navigation-menu .active-element .strike {
          padding: 24px 0;
          -webkit-mask-image: linear-gradient(to right, transparent calc(0% + var(--active-element-mask-position)), black calc(15% + var(--active-element-mask-position)), black 80%, transparent);
          mask-image: linear-gradient(to right, transparent calc(0% + var(--active-element-mask-position)), black calc(15% + var(--active-element-mask-position)), black 80%, transparent);
        }
        .navigation-menu .active-element .strike svg {
          display: block; overflow: visible; height: 12px;
          width: calc(var(--active-element-width) * 2);
          transform: translate(var(--active-element-strike-x), 30%) scale(var(--active-element-scale-x), var(--active-element-scale-y));
        }
        .navigation-menu .active-element .strike svg:last-child {
          transform: translate(var(--active-element-strike-x), -30%) scale(-1);
        }
        .navigation-menu .active-element .strike svg g path:nth-child(2) { filter: blur(2px); }
        .navigation-menu .active-element .strike svg g path:nth-child(3) { filter: blur(4px); }
        .navigation-menu.before .active-element { transform: rotateY(180deg); }
      `}</style>

            <Disclosure as="nav" className="fixed top-0 left-0 right-0 z-50 glass-panel backdrop-blur-md bg-background/95 border-b border-border">
                {({ open, close }) => (
                    <>
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex h-20 items-center justify-between">
                                {/* Logo */}
                                <div className="flex items-center">
                                    <Link to="/" className="flex items-center space-x-3 cursor-target group">
                                        {settings?.logo_url ? (
                                            <img
                                                src={settings.logo_url}
                                                alt="Logo"
                                                className="h-8 w-auto transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <Target className="w-8 h-8 text-primary transition-transform group-hover:rotate-12" />
                                        )}
                                        <div>
                                            <h1 className="font-rajdhani text-2xl font-bold text-foreground tracking-wide group-hover:text-primary transition-colors">
                                                {settings?.site_name || 'RAVEN STRIKE FORCE'}
                                            </h1>
                                            <p className="text-xs text-muted-foreground font-inter tracking-wider">
                                                {t('brand.tagline', settings?.tagline_base || 'Airsoft is more than a game').toUpperCase()}
                                            </p>
                                        </div>
                                    </Link>
                                </div>

                                {/* Tablet Navigation */}
                                <div className="hidden md:flex lg:hidden md:items-center md:space-x-6">
                                    <div className="flex items-center space-x-4">
                                        {navItems.map((item) => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={cn(
                                                    "relative font-inter text-sm font-medium transition-all duration-300 cursor-target group",
                                                    "hover:text-primary focus:outline-none focus:text-primary",
                                                    isActive(item.path)
                                                        ? "text-primary"
                                                        : "text-foreground"
                                                )}
                                            >
                                                <span className="relative z-10">{item.label.toUpperCase()}</span>
                                                {isActive(item.path) && (
                                                    <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full animate-pulse" />
                                                )}
                                                <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <LanguageSwitcher />

                                        {/* Auth Section */}
                                        {user ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="relative h-9 w-9 rounded-full hover:bg-muted transition-colors"
                                                    >
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || ''} />
                                                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                                                {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                                    <div className="flex items-center justify-start gap-2 p-2">
                                                        <div className="flex flex-col space-y-1 leading-none">
                                                            <p className="font-medium text-sm">{profile?.display_name || user.email}</p>
                                                            <p className="w-[200px] truncate text-xs text-muted-foreground">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link to="/profile" className="flex items-center cursor-target" style={{ pointerEvents: 'auto' }}>
                                                            <User className="mr-2 h-4 w-4" style={{ pointerEvents: 'none' }} />
                                                            <span style={{ pointerEvents: 'none' }}>{t('profile.title', 'Profile')}</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {(profile?.role === 'admin' || profile?.role === 'editor') && (
                                                        <DropdownMenuItem asChild>
                                                            <Link to="/admin" className="flex items-center cursor-target" style={{ pointerEvents: 'auto' }}>
                                                                <Target className="mr-2 h-4 w-4" style={{ pointerEvents: 'none' }} />
                                                                <span style={{ pointerEvents: 'none' }}>{t('admin.title', 'Admin Panel')}</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {profile?.role === 'superadmin' && (
                                                        <DropdownMenuItem asChild>
                                                            <Link to="/admin" className="flex items-center cursor-target" style={{ pointerEvents: 'auto' }}>
                                                                <Crown className="mr-2 h-4 w-4 text-primary" style={{ pointerEvents: 'none' }} />
                                                                <span style={{ pointerEvents: 'none' }}>{t('admin.title', 'Admin Panel')}</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem asChild>
                                                        <Link to="/games" className="flex items-center cursor-target" style={{ pointerEvents: 'auto' }}>
                                                            <Target className="mr-2 h-4 w-4" style={{ pointerEvents: 'none' }} />
                                                            <span style={{ pointerEvents: 'none' }}>{t('nav.games', 'Games')}</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={handleSignOut}
                                                        className="cursor-target"
                                                        data-logout-button="true"
                                                        tabIndex={0}
                                                        aria-label={t('auth.logout', 'Logout')}
                                                        style={{ pointerEvents: 'auto' }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                handleSignOut();
                                                            }
                                                        }}
                                                    >
                                                        <LogOut className="mr-2 h-4 w-4" style={{ pointerEvents: 'none' }} />
                                                        <span style={{ pointerEvents: 'none' }}>{t('auth.logout', 'Logout')}</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-target"
                                                onClick={() => {
                                                    console.log('🔐 Login button clicked, navigating to /auth');
                                                    navigate('/auth');
                                                }}
                                            >
                                                {t('auth.login', 'Login')}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop Navigation with Sparkle Effect - EXACT COPY FROM YOUR CODE */}
                                <div className="hidden lg:flex lg:items-center lg:space-x-8">
                                    <div className="flex items-center">
                                        <nav className="navigation-menu" ref={navRef}>
                                            <ul>
                                                {navItems.map((item, index) => (
                                                    <li key={item.path} className={index === activeIndex ? "active" : ""}>
                                                        <button
                                                            ref={(el) => {
                                                                buttonRefs.current[index] = el;
                                                            }}
                                                            onClick={() => handleClick(index)}
                                                            className="cursor-target"
                                                            type="button"
                                                            aria-pressed={index === activeIndex}
                                                        >
                                                            {item.label.toUpperCase()}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="active-element" ref={activeElementRef} />
                                        </nav>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <LanguageSwitcher />

                                        {/* Auth Section */}
                                        {user ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="relative h-10 w-10 rounded-full hover:bg-muted transition-colors"
                                                    >
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || ''} />
                                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                                {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-64" align="end" forceMount>
                                                    <div className="flex items-center justify-start gap-3 p-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || ''} />
                                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                                {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col space-y-1 leading-none">
                                                            <p className="font-medium text-sm">{profile?.display_name || user.email}</p>
                                                            <p className="w-[200px] truncate text-xs text-muted-foreground">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link to="/profile" className="flex items-center cursor-target" style={{ pointerEvents: 'auto' }}>
                                                            <User className="mr-3 h-4 w-4" style={{ pointerEvents: 'none' }} />
                                                            <span style={{ pointerEvents: 'none' }}>{t('profile.title', 'Profile')}</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {(profile?.role === 'admin' || profile?.role === 'editor') && (
                                                        <DropdownMenuItem asChild>
                                                            <Link to="/admin" className="flex items-center cursor-target" style={{ pointerEvents: 'auto' }}>
                                                                <Target className="mr-3 h-4 w-4" style={{ pointerEvents: 'none' }} />
                                                                <span style={{ pointerEvents: 'none' }}>{t('admin.title', 'Admin Panel')}</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {profile?.role === 'superadmin' && (
                                                        <DropdownMenuItem asChild>
                                                            <Link to="/admin" className="flex items-center cursor-target" style={{ pointerEvents: 'auto' }}>
                                                                <Crown className="mr-3 h-4 w-4 text-primary" style={{ pointerEvents: 'none' }} />
                                                                <span style={{ pointerEvents: 'none' }}>{t('admin.title', 'Admin Panel')}</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem asChild>
                                                        <Link to="/games" className="flex items-center cursor-target" style={{ pointerEvents: 'auto' }}>
                                                            <Target className="mr-3 h-4 w-4" style={{ pointerEvents: 'none' }} />
                                                            <span style={{ pointerEvents: 'none' }}>{t('nav.games', 'Games')}</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={handleSignOut}
                                                        className="cursor-target"
                                                        data-logout-button="true"
                                                        tabIndex={0}
                                                        aria-label={t('auth.logout', 'Logout')}
                                                        style={{ pointerEvents: 'auto' }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                handleSignOut();
                                                            }
                                                        }}
                                                    >
                                                        <LogOut className="mr-3 h-4 w-4" style={{ pointerEvents: 'none' }} />
                                                        <span style={{ pointerEvents: 'none' }}>{t('auth.logout', 'Logout')}</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-target"
                                                onClick={() => {
                                                    console.log('🔐 Login button clicked, navigating to /auth');
                                                    navigate('/auth');
                                                }}
                                            >
                                                {t('auth.login', 'Login')}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile menu button */}
                                <div className="md:hidden">
                                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors">
                                        <span className="sr-only">Open main menu</span>
                                        {open ? (
                                            <X className="block h-6 w-6" aria-hidden="true" />
                                        ) : (
                                            <Menu className="block h-6 w-6" aria-hidden="true" />
                                        )}
                                    </Disclosure.Button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Navigation */}
                        <Disclosure.Panel className="md:hidden">
                            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background/95 backdrop-blur-md border-t border-border">
                                {/* Navigation Items */}
                                <div className="space-y-1">
                                    {navItems.map((item, index) => (
                                        <Disclosure.Button
                                            key={item.path}
                                            as={Link}
                                            to={item.path}
                                            onClick={() => close()}
                                            className={cn(
                                                "block w-full text-left rounded-md px-3 py-3 text-base font-medium transition-all duration-200",
                                                isActive(item.path)
                                                    ? "bg-primary/20 text-primary border-l-4 border-primary"
                                                    : "text-foreground hover:bg-muted hover:text-primary"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{item.label.toUpperCase()}</span>
                                                    <span className="text-xs text-muted-foreground mt-1 font-normal">
                                                        {item.description}
                                                    </span>
                                                </div>
                                                {isActive(item.path) && (
                                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                                )}
                                            </div>
                                        </Disclosure.Button>
                                    ))}
                                </div>

                                {/* Auth Section */}
                                <div className="pt-4 pb-3 border-t border-border">
                                    {user ? (
                                        <div className="flex items-center px-3">
                                            <div className="flex-shrink-0">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || ''} />
                                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                                        {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-base font-medium text-foreground">
                                                    {profile?.display_name || user.email}
                                                </div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="px-3">
                                            <Button 
                                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-target"
                                                onClick={() => {
                                                    console.log('🔐 Login button clicked (mobile), navigating to /auth');
                                                    navigate('/auth');
                                                }}
                                            >
                                                {t('auth.login', 'Login')}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* User Menu Items */}
                                {user && (
                                    <div className="space-y-1">
                                        <Disclosure.Button
                                            as={Link}
                                            to="/profile"
                                            onClick={() => close()}
                                            className="flex items-center px-3 py-2 text-base font-medium text-foreground hover:bg-muted hover:text-primary rounded-md transition-colors cursor-target"
                                        >
                                            <User className="mr-3 h-5 w-5" />
                                            {t('profile.title', 'Profile')}
                                        </Disclosure.Button>
                                        {(profile?.role === 'admin' || profile?.role === 'editor' || profile?.role === 'superadmin') && (
                                            <Disclosure.Button
                                                as={Link}
                                                to="/admin"
                                                onClick={() => close()}
                                                className="flex items-center px-3 py-2 text-base font-medium text-foreground hover:bg-muted hover:text-primary rounded-md transition-colors cursor-target"
                                            >
                                                {profile?.role === 'superadmin' ? (
                                                    <Crown className="mr-3 h-5 w-5 text-primary" />
                                                ) : (
                                                    <Target className="mr-3 h-5 w-5" />
                                                )}
                                                {t('admin.title', 'Admin Panel')}
                                            </Disclosure.Button>
                                        )}
                                        <Disclosure.Button
                                            onClick={() => {
                                                handleSignOut();
                                                close();
                                            }}
                                            className="flex items-center px-3 py-2 text-base font-medium text-foreground hover:bg-muted hover:text-primary rounded-md transition-colors cursor-target"
                                            data-logout-button="true"
                                            tabIndex={0}
                                            aria-label={t('auth.logout', 'Logout')}
                                            style={{ pointerEvents: 'auto' }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleSignOut();
                                                    close();
                                                }
                                            }}
                                        >
                                            <LogOut className="mr-3 h-5 w-5" style={{ pointerEvents: 'none' }} />
                                            <span style={{ pointerEvents: 'none' }}>{t('auth.logout', 'Logout')}</span>
                                        </Disclosure.Button>
                                    </div>
                                )}

                                {/* Language Switcher */}
                                <div className="px-3 pt-2">
                                    <LanguageSwitcher />
                                </div>
                            </div>
                        </Disclosure.Panel>
                    </>
                )}
            </Disclosure>
        </>
    );
};

export default ModernNavbar;