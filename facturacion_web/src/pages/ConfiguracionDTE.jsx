import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, FileBadge, Building2, Server, Mail, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const empresaId = () => localStorage.getItem('empresa_id') || '';

// Catálogo Oficial Geográfico MH El Salvador V1.1 (Resguardo Estático Inmediato)
const DEPARTAMENTOS_MH = [
  { codigo: "01", nombre: "Ahuachapán", distritos: [
    { codigo: "01", nombre: "Ahuachapán", mun_cod: "14", mun_nom: "AHUACHAPÁN CENTRO" },
    { codigo: "02", nombre: "Apaneca", mun_cod: "14", mun_nom: "AHUACHAPÁN CENTRO" },
    { codigo: "03", nombre: "Atiquizaya", mun_cod: "13", mun_nom: "AHUACHAPÁN NORTE" },
    { codigo: "04", nombre: "Concepción de Ataco", mun_cod: "14", mun_nom: "AHUACHAPÁN CENTRO" },
    { codigo: "05", nombre: "El Refugio", mun_cod: "13", mun_nom: "AHUACHAPÁN NORTE" },
    { codigo: "06", nombre: "Guaymango", mun_cod: "15", mun_nom: "AHUACHAPÁN SUR" },
    { codigo: "07", nombre: "Jujutla", mun_cod: "15", mun_nom: "AHUACHAPÁN SUR" },
    { codigo: "08", nombre: "San Francisco Menéndez", mun_cod: "15", mun_nom: "AHUACHAPÁN SUR" },
    { codigo: "09", nombre: "San Lorenzo", mun_cod: "13", mun_nom: "AHUACHAPÁN NORTE" },
    { codigo: "10", nombre: "San Pedro Puxtla", mun_cod: "15", mun_nom: "AHUACHAPÁN SUR" },
    { codigo: "11", nombre: "Tacuba", mun_cod: "14", mun_nom: "AHUACHAPÁN CENTRO" },
    { codigo: "12", nombre: "Turín", mun_cod: "13", mun_nom: "AHUACHAPÁN NORTE" }
  ]},
  { codigo: "02", nombre: "Santa Ana", distritos: [
    { codigo: "01", nombre: "Candelaria de la Frontera", mun_cod: "17", mun_nom: "SANTA ANA OESTE" },
    { codigo: "02", nombre: "Coatepeque", mun_cod: "16", mun_nom: "SANTA ANA ESTE" },
    { codigo: "03", nombre: "Chalchuapa", mun_cod: "17", mun_nom: "SANTA ANA OESTE" },
    { codigo: "04", nombre: "El Congo", mun_cod: "16", mun_nom: "SANTA ANA ESTE" },
    { codigo: "05", nombre: "El Porvenir", mun_cod: "17", mun_nom: "SANTA ANA OESTE" },
    { codigo: "06", nombre: "Masahuat", mun_cod: "14", mun_nom: "SANTA ANA NORTE" },
    { codigo: "07", nombre: "Metapán", mun_cod: "14", mun_nom: "SANTA ANA NORTE" },
    { codigo: "08", nombre: "San Antonio Pajonal", mun_cod: "14", mun_nom: "SANTA ANA NORTE" },
    { codigo: "09", nombre: "San Sebastián Salitrillo", mun_cod: "17", mun_nom: "SANTA ANA OESTE" },
    { codigo: "10", nombre: "Santa Ana", mun_cod: "15", mun_nom: "SANTA ANA CENTRO" },
    { codigo: "11", nombre: "Santa Rosa Guachipilín", mun_cod: "14", mun_nom: "SANTA ANA NORTE" },
    { codigo: "12", nombre: "Santiago de la Frontera", mun_cod: "17", mun_nom: "SANTA ANA OESTE" },
    { codigo: "13", nombre: "Texistepeque", mun_cod: "17", mun_nom: "SANTA ANA OESTE" }
  ]},
  { codigo: "03", nombre: "Sonsonate", distritos: [
    { codigo: "01", nombre: "Acajutla", mun_cod: "20", mun_nom: "SONSONATE OESTE" },
    { codigo: "02", nombre: "Armenia", mun_cod: "19", mun_nom: "SONSONATE ESTE" },
    { codigo: "03", nombre: "Caluco", mun_cod: "19", mun_nom: "SONSONATE ESTE" },
    { codigo: "04", nombre: "Cuisnahuat", mun_cod: "19", mun_nom: "SONSONATE ESTE" },
    { codigo: "05", nombre: "Santa Isabel Ishuatán", mun_cod: "19", mun_nom: "SONSONATE ESTE" },
    { codigo: "06", nombre: "Izalco", mun_cod: "19", mun_nom: "SONSONATE ESTE" },
    { codigo: "07", nombre: "Juayúa", mun_cod: "17", mun_nom: "SONSONATE NORTE" },
    { codigo: "08", nombre: "Nahuizalco", mun_cod: "17", mun_nom: "SONSONATE NORTE" },
    { codigo: "09", nombre: "Nahulingo", mun_cod: "18", mun_nom: "SONSONATE CENTRO" },
    { codigo: "10", nombre: "Salcoatitán", mun_cod: "17", mun_nom: "SONSONATE NORTE" },
    { codigo: "11", nombre: "San Antonio del Monte", mun_cod: "18", mun_nom: "SONSONATE CENTRO" },
    { codigo: "12", nombre: "San Julián", mun_cod: "19", mun_nom: "SONSONATE ESTE" },
    { codigo: "13", nombre: "Santa Catarina Masahuat", mun_cod: "17", mun_nom: "SONSONATE NORTE" },
    { codigo: "14", nombre: "Santo Domingo Guzmán", mun_cod: "18", mun_nom: "SONSONATE CENTRO" },
    { codigo: "15", nombre: "Sonsonate", mun_cod: "18", mun_nom: "SONSONATE CENTRO" },
    { codigo: "16", nombre: "Sonzacate", mun_cod: "18", mun_nom: "SONSONATE CENTRO" }
  ]},
  { codigo: "04", nombre: "Chalatenango", distritos: [
    { codigo: "01", nombre: "Agua Caliente", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "02", nombre: "Arcatao", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "03", nombre: "Azacualpa", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "04", nombre: "Citalá", mun_cod: "34", mun_nom: "CHALATENANGO NORTE" },
    { codigo: "05", nombre: "Comalapa", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "06", nombre: "Concepción Quezaltepeque", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "07", nombre: "Chalatenango", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "08", nombre: "Dulce Nombre de María", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "09", nombre: "El Carrizal", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "10", nombre: "El Paraíso", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "11", nombre: "La Laguna", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "12", nombre: "La Palma", mun_cod: "34", mun_nom: "CHALATENANGO NORTE" },
    { codigo: "13", nombre: "La Reina", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "14", nombre: "Las Vueltas", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "15", nombre: "Nombre de Jesús", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "16", nombre: "Nueva Concepción", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "17", nombre: "Nueva Trinidad", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "18", nombre: "Ojos de Agua", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "19", nombre: "Potonico", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "20", nombre: "San Antonio de la Cruz", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "21", nombre: "San Antonio Los Ranchos", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "22", nombre: "San Fernando", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "23", nombre: "San Francisco Lempa", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "24", nombre: "San Francisco Morazán", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "25", nombre: "San Ignacio", mun_cod: "34", mun_nom: "CHALATENANGO NORTE" },
    { codigo: "26", nombre: "San Isidro Labrador", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "27", nombre: "San José Cancasque", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "28", nombre: "San José Flores", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "29", nombre: "San Luis del Carmen", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "30", nombre: "San Miguel de Mercedes", mun_cod: "36", mun_nom: "CHALATENANGO SUR" },
    { codigo: "31", nombre: "San Rafael", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "32", nombre: "Santa Rita", mun_cod: "35", mun_nom: "CHALATENANGO CENTRO" },
    { codigo: "33", nombre: "Tejutla", mun_cod: "36", mun_nom: "CHALATENANGO SUR" }
  ]},
  { codigo: "05", nombre: "La Libertad", distritos: [
    { codigo: "01", nombre: "Antiguo Cuscatlán", mun_cod: "26", mun_nom: "LA LIBERTAD ESTE" },
    { codigo: "02", nombre: "Ciudad Arce", mun_cod: "24", mun_nom: "LA LIBERTAD CENTRO" },
    { codigo: "03", nombre: "Colón", mun_cod: "25", mun_nom: "LA LIBERTAD OESTE" },
    { codigo: "04", nombre: "Comasagua", mun_cod: "28", mun_nom: "LA LIBERTAD SUR" },
    { codigo: "05", nombre: "Chiltiupán", mun_cod: "27", mun_nom: "LA LIBERTAD COSTA" },
    { codigo: "06", nombre: "Huizúcar", mun_cod: "26", mun_nom: "LA LIBERTAD ESTE" },
    { codigo: "07", nombre: "Jayaque", mun_cod: "25", mun_nom: "LA LIBERTAD OESTE" },
    { codigo: "08", nombre: "Jicalapa", mun_cod: "27", mun_nom: "LA LIBERTAD COSTA" },
    { codigo: "09", nombre: "La Libertad", mun_cod: "27", mun_nom: "LA LIBERTAD COSTA" },
    { codigo: "10", nombre: "Nuevo Cuscatlán", mun_cod: "26", mun_nom: "LA LIBERTAD ESTE" },
    { codigo: "11", nombre: "Santa Tecla", mun_cod: "26", mun_nom: "LA LIBERTAD ESTE" },
    { codigo: "12", nombre: "Quezaltepeque", mun_cod: "23", mun_nom: "LA LIBERTAD NORTE" },
    { codigo: "13", nombre: "Sacacoyo", mun_cod: "25", mun_nom: "LA LIBERTAD OESTE" },
    { codigo: "14", nombre: "San José Villanueva", mun_cod: "28", mun_nom: "LA LIBERTAD SUR" },
    { codigo: "15", nombre: "San Juan Opico", mun_cod: "24", mun_nom: "LA LIBERTAD CENTRO" },
    { codigo: "16", nombre: "San Matías", mun_cod: "23", mun_nom: "LA LIBERTAD NORTE" },
    { codigo: "17", nombre: "San Pablo Tacachico", mun_cod: "23", mun_nom: "LA LIBERTAD NORTE" },
    { codigo: "18", nombre: "Tamanique", mun_cod: "27", mun_nom: "LA LIBERTAD COSTA" },
    { codigo: "19", nombre: "Talnique", mun_cod: "25", mun_nom: "LA LIBERTAD OESTE" },
    { codigo: "20", nombre: "Teotepeque", mun_cod: "27", mun_nom: "LA LIBERTAD COSTA" },
    { codigo: "21", nombre: "Tepecoyo", mun_cod: "25", mun_nom: "LA LIBERTAD OESTE" },
    { codigo: "22", nombre: "Zaragoza", mun_cod: "26", mun_nom: "LA LIBERTAD ESTE" }
  ]},
  { codigo: "06", nombre: "San Salvador", distritos: [
    { codigo: "01", nombre: "Aguilares", mun_cod: "20", mun_nom: "SAN SALVADOR NORTE" },
    { codigo: "02", nombre: "Apopa", mun_cod: "21", mun_nom: "SAN SALVADOR OESTE" },
    { codigo: "03", nombre: "Ayutuxtepeque", mun_cod: "23", mun_nom: "SAN SALVADOR CENTRO" },
    { codigo: "04", nombre: "Cuscatancingo", mun_cod: "23", mun_nom: "SAN SALVADOR CENTRO" },
    { codigo: "05", nombre: "El Paisnal", mun_cod: "20", mun_nom: "SAN SALVADOR NORTE" },
    { codigo: "06", nombre: "Guazapa", mun_cod: "20", mun_nom: "SAN SALVADOR NORTE" },
    { codigo: "07", nombre: "Ilopango", mun_cod: "22", mun_nom: "SAN SALVADOR ESTE" },
    { codigo: "08", nombre: "Mejicanos", mun_cod: "23", mun_nom: "SAN SALVADOR CENTRO" },
    { codigo: "09", nombre: "Nejapa", mun_cod: "21", mun_nom: "SAN SALVADOR OESTE" },
    { codigo: "10", nombre: "Panchimalco", mun_cod: "24", mun_nom: "SAN SALVADOR SUR" },
    { codigo: "11", nombre: "Rosario de Mora", mun_cod: "24", mun_nom: "SAN SALVADOR SUR" },
    { codigo: "12", nombre: "San Marcos", mun_cod: "24", mun_nom: "SAN SALVADOR SUR" },
    { codigo: "13", nombre: "San Martín", mun_cod: "22", mun_nom: "SAN SALVADOR ESTE" },
    { codigo: "14", nombre: "San Salvador", mun_cod: "23", mun_nom: "SAN SALVADOR CENTRO" },
    { codigo: "15", nombre: "Santiago Texacuangos", mun_cod: "24", mun_nom: "SAN SALVADOR SUR" },
    { codigo: "16", nombre: "Santo Tomás", mun_cod: "24", mun_nom: "SAN SALVADOR SUR" },
    { codigo: "17", nombre: "Soyapango", mun_cod: "22", mun_nom: "SAN SALVADOR ESTE" },
    { codigo: "18", nombre: "Tonacatepeque", mun_cod: "22", mun_nom: "SAN SALVADOR ESTE" },
    { codigo: "19", nombre: "Ciudad Delgado", mun_cod: "23", mun_nom: "SAN SALVADOR CENTRO" }
  ]},
  { codigo: "07", nombre: "Cuscatlán", distritos: [
    { codigo: "01", nombre: "Candelaria", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "02", nombre: "Cojutepeque", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "03", nombre: "El Carmen", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "04", nombre: "El Rosario", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "05", nombre: "Monte San Juan", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "06", nombre: "Oratorio de Concepción", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "07", nombre: "San Bartolomé Perulapía", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "08", nombre: "San Cristóbal", mun_cod: "17", mun_nom: "CUSCATLÁN NORTE" },
    { codigo: "09", nombre: "San José Guayabal", mun_cod: "17", mun_nom: "CUSCATLÁN NORTE" },
    { codigo: "10", nombre: "San Pedro Perulapán", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "11", nombre: "San Rafael Cedros", mun_cod: "17", mun_nom: "CUSCATLÁN NORTE" },
    { codigo: "12", nombre: "San Ramón", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "13", nombre: "Santa Cruz Analquito", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "14", nombre: "Santa Cruz Michapa", mun_cod: "18", mun_nom: "CUSCATLÁN SUR" },
    { codigo: "15", nombre: "Suchitoto", mun_cod: "17", mun_nom: "CUSCATLÁN NORTE" },
    { codigo: "16", nombre: "Tenancingo", mun_cod: "17", mun_nom: "CUSCATLÁN NORTE" }
  ]},
  { codigo: "08", nombre: "La Paz", distritos: [
    { codigo: "01", nombre: "Cuyultitán", mun_cod: "23", mun_nom: "LA PAZ OESTE" },
    { codigo: "02", nombre: "El Rosario", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "03", nombre: "Jerusalén", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "04", nombre: "Merced La Ceiba", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "05", nombre: "Olocuilta", mun_cod: "23", mun_nom: "LA PAZ OESTE" },
    { codigo: "06", nombre: "Paraíso Osorio", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "07", nombre: "San Antonio Masahuat", mun_cod: "23", mun_nom: "LA PAZ OESTE" },
    { codigo: "08", nombre: "San Emigdio", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "09", nombre: "San Francisco Chinameca", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "10", nombre: "San Juan Nonualco", mun_cod: "25", mun_nom: "LA PAZ ESTE" },
    { codigo: "11", nombre: "San Juan Talpa", mun_cod: "23", mun_nom: "LA PAZ OESTE" },
    { codigo: "12", nombre: "San Juan Tepezontes", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "13", nombre: "San Luis Talpa", mun_cod: "23", mun_nom: "LA PAZ OESTE" },
    { codigo: "14", nombre: "San Miguel Tepezontes", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "15", nombre: "San Pedro Masahuat", mun_cod: "23", mun_nom: "LA PAZ OESTE" },
    { codigo: "16", nombre: "San Pedro Nonualco", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "17", nombre: "San Rafael Obrajuelo", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "18", nombre: "Santa María Ostuma", mun_cod: "24", mun_nom: "LA PAZ CENTRO" },
    { codigo: "19", nombre: "Santiago Nonualco", mun_cod: "25", mun_nom: "LA PAZ ESTE" },
    { codigo: "20", nombre: "Tapalhuaca", mun_cod: "23", mun_nom: "LA PAZ OESTE" },
    { codigo: "21", nombre: "Zacatecoluca", mun_cod: "25", mun_nom: "LA PAZ ESTE" },
    { codigo: "22", nombre: "San Luis La Herradura", mun_cod: "25", mun_nom: "LA PAZ ESTE" }
  ]},
  { codigo: "09", nombre: "Cabañas", distritos: [
    { codigo: "01", nombre: "Cinquera", mun_cod: "11", mun_nom: "CABAÑAS OESTE" },
    { codigo: "02", nombre: "Guacotecti", mun_cod: "11", mun_nom: "CABAÑAS OESTE" },
    { codigo: "03", nombre: "Ilobasco", mun_cod: "11", mun_nom: "CABAÑAS OESTE" },
    { codigo: "04", nombre: "Jutiapa", mun_cod: "10", mun_nom: "CABAÑAS ESTE" },
    { codigo: "05", nombre: "San Isidro", mun_cod: "11", mun_nom: "CABAÑAS OESTE" },
    { codigo: "06", nombre: "Sensuntepeque", mun_cod: "10", mun_nom: "CABAÑAS ESTE" },
    { codigo: "07", nombre: "Tejutepeque", mun_cod: "10", mun_nom: "CABAÑAS ESTE" },
    { codigo: "08", nombre: "Victoria", mun_cod: "10", mun_nom: "CABAÑAS ESTE" },
    { codigo: "09", nombre: "Dolores", mun_cod: "10", mun_nom: "CABAÑAS ESTE" }
  ]},
  { codigo: "10", nombre: "San Vicente", distritos: [
    { codigo: "01", nombre: "Apastepeque", mun_cod: "14", mun_nom: "SAN VICENTE NORTE" },
    { codigo: "02", nombre: "Guadalupe", mun_cod: "15", mun_nom: "SAN VICENTE SUR" },
    { codigo: "03", nombre: "San Cayetano Istepeque", mun_cod: "15", mun_nom: "SAN VICENTE SUR" },
    { codigo: "04", nombre: "Santa Clara", mun_cod: "14", mun_nom: "SAN VICENTE NORTE" },
    { codigo: "05", nombre: "Santo Domingo", mun_cod: "14", mun_nom: "SAN VICENTE NORTE" },
    { codigo: "06", nombre: "San Esteban Catarina", mun_cod: "14", mun_nom: "SAN VICENTE NORTE" },
    { codigo: "07", nombre: "San Ildefonso", mun_cod: "14", mun_nom: "SAN VICENTE NORTE" },
    { codigo: "08", nombre: "San Lorenzo", mun_cod: "14", mun_nom: "SAN VICENTE NORTE" },
    { codigo: "09", nombre: "San Sebastián", mun_cod: "14", mun_nom: "SAN VICENTE NORTE" },
    { codigo: "10", nombre: "San Vicente", mun_cod: "15", mun_nom: "SAN VICENTE SUR" },
    { codigo: "11", nombre: "Tecoluca", mun_cod: "15", mun_nom: "SAN VICENTE SUR" },
    { codigo: "12", nombre: "Tepetitán", mun_cod: "15", mun_nom: "SAN VICENTE SUR" },
    { codigo: "13", nombre: "Verapaz", mun_cod: "15", mun_nom: "SAN VICENTE SUR" }
  ]},
  { codigo: "11", nombre: "Usulután", distritos: [
    { codigo: "01", nombre: "Alegría", mun_cod: "24", mun_nom: "USULUTÁN NORTE" },
    { codigo: "02", nombre: "Berlín", mun_cod: "24", mun_nom: "USULUTÁN NORTE" },
    { codigo: "03", nombre: "California", mun_cod: "24", mun_nom: "USULUTÁN NORTE" },
    { codigo: "04", nombre: "Concepción Batres", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "05", nombre: "El Triunfo", mun_cod: "24", mun_nom: "USULUTÁN NORTE" },
    { codigo: "06", nombre: "Ereguayquín", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "07", nombre: "Estanzuelas", mun_cod: "24", mun_nom: "USULUTÁN NORTE" },
    { codigo: "08", nombre: "Jiquilisco", mun_cod: "26", mun_nom: "USULUTÁN OESTE" },
    { codigo: "09", nombre: "Jucuapa", mun_cod: "24", mun_nom: "USULUTÁN NORTE" },
    { codigo: "10", nombre: "Jucuarán", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "11", nombre: "Mercedes Umaña", mun_cod: "24", mun_nom: "USULUTÁN NORTE" },
    { codigo: "12", nombre: "Nueva Granada", mun_cod: "24", mun_nom: "USULUTÁN NORTE" },
    { codigo: "13", nombre: "Ozatlán", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "14", nombre: "Puerto El Triunfo", mun_cod: "26", mun_nom: "USULUTÁN OESTE" },
    { codigo: "15", nombre: "San Agustín", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "16", nombre: "San Buenaventura", mun_cod: "26", mun_nom: "USULUTÁN OESTE" },
    { codigo: "17", nombre: "San Dionisio", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "18", nombre: "Santa Elena", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "19", nombre: "San Francisco Javier", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "20", nombre: "Santa María", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "21", nombre: "Santiago de María", mun_cod: "24", mun_nom: "USULUTÁN NORTE" },
    { codigo: "22", nombre: "Tecapán", mun_cod: "25", mun_nom: "USULUTÁN ESTE" },
    { codigo: "23", nombre: "Usulután", mun_cod: "25", mun_nom: "USULUTÁN ESTE" }
  ]},
  { codigo: "12", nombre: "San Miguel", distritos: [
    { codigo: "01", nombre: "Carolina", mun_cod: "21", mun_nom: "SAN MIGUEL NORTE" },
    { codigo: "02", nombre: "Ciudad Barrios", mun_cod: "21", mun_nom: "SAN MIGUEL NORTE" },
    { codigo: "03", nombre: "Comacarán", mun_cod: "22", mun_nom: "SAN MIGUEL CENTRO" },
    { codigo: "04", nombre: "Chapeltique", mun_cod: "21", mun_nom: "SAN MIGUEL NORTE" },
    { codigo: "05", nombre: "Chinameca", mun_cod: "22", mun_nom: "SAN MIGUEL CENTRO" },
    { codigo: "06", nombre: "Chirilagua", mun_cod: "22", mun_nom: "SAN MIGUEL CENTRO" },
    { codigo: "07", nombre: "El Tránsito", mun_cod: "22", mun_nom: "SAN MIGUEL CENTRO" },
    { codigo: "08", nombre: "Lolotique", mun_cod: "23", mun_nom: "SAN MIGUEL OESTE" },
    { codigo: "09", nombre: "Moncagua", mun_cod: "22", mun_nom: "SAN MIGUEL CENTRO" },
    { codigo: "10", nombre: "Nueva Guadalupe", mun_cod: "23", mun_nom: "SAN MIGUEL OESTE" },
    { codigo: "11", nombre: "Nuevo Edén de San Juan", mun_cod: "21", mun_nom: "SAN MIGUEL NORTE" },
    { codigo: "12", nombre: "Quelepa", mun_cod: "22", mun_nom: "SAN MIGUEL CENTRO" },
    { codigo: "13", nombre: "San Antonio del Mosco", mun_cod: "23", mun_nom: "SAN MIGUEL OESTE" },
    { codigo: "14", nombre: "San Gerardo", mun_cod: "21", mun_nom: "SAN MIGUEL NORTE" },
    { codigo: "15", nombre: "San Jorge", mun_cod: "23", mun_nom: "SAN MIGUEL OESTE" },
    { codigo: "16", nombre: "San Luis de la Reina", mun_cod: "21", mun_nom: "SAN MIGUEL NORTE" },
    { codigo: "17", nombre: "San Miguel", mun_cod: "22", mun_nom: "SAN MIGUEL CENTRO" },
    { codigo: "18", nombre: "San Rafael Oriente", mun_cod: "23", mun_nom: "SAN MIGUEL OESTE" },
    { codigo: "19", nombre: "Sesori", mun_cod: "21", mun_nom: "SAN MIGUEL NORTE" },
    { codigo: "20", nombre: "Uluazapa", mun_cod: "23", mun_nom: "SAN MIGUEL OESTE" }
  ]},
  { codigo: "13", nombre: "Morazán", distritos: [
    { codigo: "01", nombre: "Arambala", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "02", nombre: "Cacaopera", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "03", nombre: "Corinto", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "04", nombre: "Chilanga", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "05", nombre: "Delicias de Concepción", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "06", nombre: "El Divisadero", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "07", nombre: "El Rosario", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "08", nombre: "Gualococti", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "09", nombre: "Guatajiagua", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "10", nombre: "Joateca", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "11", nombre: "Jocoaitique", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "12", nombre: "Jocoro", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "13", nombre: "Lolotiquillo", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "14", nombre: "Meanguera", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "15", nombre: "Osicala", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "16", nombre: "Perquín", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "17", nombre: "San Carlos", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "18", nombre: "San Fernando", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "19", nombre: "San Francisco Gotera", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "20", nombre: "San Isidro", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "21", nombre: "San Simón", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "22", nombre: "Sensembra", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "23", nombre: "Sociedad", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "24", nombre: "Torola", mun_cod: "27", mun_nom: "MORAZÁN NORTE" },
    { codigo: "25", nombre: "Yamabal", mun_cod: "28", mun_nom: "MORAZÁN SUR" },
    { codigo: "26", nombre: "Yoloaiquín", mun_cod: "28", mun_nom: "MORAZÁN SUR" }
  ]},
  { codigo: "14", nombre: "La Unión", distritos: [
    { codigo: "01", nombre: "Anamorós", mun_cod: "19", mun_nom: "LA UNIÓN NORTE" },
    { codigo: "02", nombre: "Bolívar", mun_cod: "19", mun_nom: "LA UNIÓN NORTE" },
    { codigo: "03", nombre: "Concepción de Oriente", mun_cod: "19", mun_nom: "LA UNIÓN NORTE" },
    { codigo: "04", nombre: "Conchagua", mun_cod: "20", mun_nom: "LA UNIÓN SUR" },
    { codigo: "05", nombre: "El Carmen", mun_cod: "20", mun_nom: "LA UNIÓN SUR" },
    { codigo: "06", nombre: "El Sauce", mun_cod: "19", mun_nom: "LA UNIÓN NORTE" },
    { codigo: "07", nombre: "Intipucá", mun_cod: "20", mun_nom: "LA UNIÓN SUR" },
    { codigo: "08", nombre: "La Unión", mun_cod: "20", mun_nom: "LA UNIÓN SUR" },
    { codigo: "09", nombre: "Lislique", mun_cod: "19", mun_nom: "LA UNIÓN NORTE" },
    { codigo: "10", nombre: "Meanguera del Golfo", mun_cod: "20", mun_nom: "LA UNIÓN SUR" },
    { codigo: "11", nombre: "Nueva Esparta", mun_cod: "19", mun_nom: "LA UNIÓN NORTE" },
    { codigo: "12", nombre: "Pasaquina", mun_cod: "19", mun_nom: "LA UNIÓN NORTE" },
    { codigo: "13", nombre: "Polorós", mun_cod: "19", mun_nom: "LA UNIÓN NORTE" },
    { codigo: "14", nombre: "San Alejo", mun_cod: "20", mun_nom: "LA UNIÓN SUR" },
    { codigo: "15", nombre: "San José", mun_cod: "20", mun_nom: "LA UNIÓN SUR" },
    { codigo: "16", nombre: "Santa Rosa de Lima", mun_cod: "19", mun_nom: "LA UNIÓN NORTE" },
    { codigo: "17", nombre: "Yayantique", mun_cod: "20", mun_nom: "LA UNIÓN SUR" },
    { codigo: "18", nombre: "Yucuaiquín", mun_cod: "20", mun_nom: "LA UNIÓN SUR" }
  ]}
];

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
);

export default function ConfiguracionDTE() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [probandoSmtp, setProbandoSmtp] = useState(false);
  const [smtpMensaje, setSmtpMensaje] = useState(null);
  const [instruccionesSmtp, setInstruccionesSmtp] = useState('');

  // Estructura de Catálogos Geográficos
  const [distritosDisponibles, setDistritosDisponibles] = useState([]);

  const [config, setConfig] = useState({
    nit: '', nrc: '', nombre_comercial: '', actividad_economica_cod: '',
    desc_actividad_economica: '', direccion_municipio: '', direccion_departamento: '',
    direccion_distrito: '', direccion_complemento: '', telefono: '', email: '',
    establecimiento_tipo: '02', establecimiento_cod: '0000',
    ambiente: '00', api_pwd: '', certificado_pwd: '',
    smtp_host: '', smtp_port: 587, smtp_username: '', smtp_password: '',
    smtp_use_tls: true, smtp_from_email: ''
  });

  const cargar = async () => {
    setCargando(true);
    try {
      // 1. Cargar Configuración Actual
      const res = await api.get(`/api/v1/configuracion/configuracion-dte/?empresa_id=${empresaId()}`);
      const datos = res.data;
      setConfig({ ...datos, api_pwd: '', certificado_pwd: '', smtp_password: '' });

      // 2. Si ya hay departamento seleccionado, cargar sus distritos inmediatamente
      if (datos.direccion_departamento) {
        const deptoEncontrado = DEPARTAMENTOS_MH.find(d => d.codigo === datos.direccion_departamento);
        if (deptoEncontrado) {
          setDistritosDisponibles(deptoEncontrado.distritos || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  // Handler: 1. Seleccionar Departamento
  const manejarCambioDepartamento = (deptoCod) => {
    const deptoEncontrado = DEPARTAMENTOS_MH.find(d => d.codigo === deptoCod);
    const dists = deptoEncontrado ? deptoEncontrado.distritos : [];
    
    setDistritosDisponibles(dists);
    
    setConfig(prev => ({
      ...prev,
      direccion_departamento: deptoCod,
      direccion_distrito: '',
      direccion_municipio: ''
    }));
  };

  // Handler: 2. Seleccionar Distrito -> 3. Auto-asignar Municipio
  const manejarCambioDistrito = (distritoCod) => {
    const distEncontrado = distritosDisponibles.find(d => d.codigo === distritoCod);

    if (distEncontrado) {
      setConfig(prev => ({
        ...prev,
        direccion_distrito: distritoCod,
        direccion_municipio: distEncontrado.mun_cod,
        direccion_municipio_nombre: distEncontrado.mun_nom
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        direccion_distrito: distritoCod,
        direccion_municipio: ''
      }));
    }
  };

  // Auto-detección de servidor SMTP al escribir el correo
  const manejarAutoDetectarSMTP = async (emailInput) => {
    setConfig(prev => ({ ...prev, smtp_username: emailInput, email: emailInput }));
    if (emailInput.includes('@')) {
      try {
        const res = await api.post('/api/v1/configuracion/configuracion-dte/auto-detectar-smtp', { email: emailInput });
        const auto = res.data;
        if (auto.smtp_host) {
          setConfig(prev => ({
            ...prev,
            smtp_host: auto.smtp_host,
            smtp_port: auto.smtp_port || 587,
            smtp_use_tls: auto.smtp_use_tls !== undefined ? auto.smtp_use_tls : true
          }));
        }
        if (auto.instrucciones) {
          setInstruccionesSmtp(auto.instrucciones);
        }
      } catch (ex) {
        console.error(ex);
      }
    }
  };

  const probarConexionSMTP = async () => {
    setProbandoSmtp(true);
    setSmtpMensaje(null);
    try {
      const payload = {
        smtp_host: config.smtp_host,
        smtp_port: parseInt(config.smtp_port) || 587,
        smtp_username: config.smtp_username,
        smtp_password: config.smtp_password,
        smtp_use_tls: config.smtp_use_tls,
        smtp_from_email: config.smtp_from_email || config.smtp_username
      };
      const res = await api.post('/api/v1/configuracion/configuracion-dte/probar-smtp', payload);
      setSmtpMensaje({ exito: true, texto: res.data.mensaje });
    } catch (e) {
      setSmtpMensaje({ exito: false, texto: e.response?.data?.detail || 'Fallo la prueba de conexión SMTP' });
    } finally {
      setProbandoSmtp(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.put(`/api/v1/configuracion/configuracion-dte/?empresa_id=${empresaId()}`, config);
      alert('Configuración DTE y Correo guardada exitosamente');
      cargar();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = btoa(new Uint8Array(ev.target.result).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        setConfig({ ...config, certificado_p12_base64: base64 });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  if (cargando) return <div className="p-8 text-center text-slate-400">Cargando configuración...</div>;

  // Obtener nombre del municipio auto-asignado para mostrar al usuario
  const distActual = distritosDisponibles.find(d => d.codigo === config.direccion_distrito);
  const nombreMunicipioAuto = distActual ? `${distActual.mun_nom} (Cod: ${distActual.mun_cod})` : (config.direccion_municipio ? `Cod MH: ${config.direccion_municipio}` : '');

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" /> Configuración DTE (Hacienda)
          </h1>
          <p className="text-sm text-slate-500 mt-1">Credenciales, ubicación geográfica y correo saliente para Facturación Electrónica</p>
        </div>
        <button onClick={guardar} disabled={guardando} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-md transition-all">
          <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Datos del Emisor */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" /> Datos del Emisor
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="NIT"><Input value={config.nit || ''} onChange={e => setConfig({...config, nit: e.target.value})} placeholder="0000-000000-000-0" /></Field>
            <Field label="NRC"><Input value={config.nrc || ''} onChange={e => setConfig({...config, nrc: e.target.value})} placeholder="123456-7" /></Field>
            <Field label="Nombre Comercial"><Input value={config.nombre_comercial || ''} onChange={e => setConfig({...config, nombre_comercial: e.target.value})} /></Field>
            <Field label="Código Actividad Económica"><Input value={config.actividad_economica_cod || ''} onChange={e => setConfig({...config, actividad_economica_cod: e.target.value})} placeholder="Ej: 62010" /></Field>
            
            <div className="col-span-2">
              <Field label="Descripción de Actividad"><Input value={config.desc_actividad_economica || ''} onChange={e => setConfig({...config, desc_actividad_economica: e.target.value})} /></Field>
            </div>
            
            {/* 1. DEPARTAMENTO (Desplegable) */}
            <Field label="1. Departamento (MH)">
              <select
                value={config.direccion_departamento || ''}
                onChange={e => manejarCambioDepartamento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Seleccione Departamento --</option>
                {DEPARTAMENTOS_MH.map(depto => (
                  <option key={depto.codigo} value={depto.codigo}>
                    {depto.codigo} - {depto.nombre}
                  </option>
                ))}
              </select>
            </Field>

            {/* 2. DISTRITO (Desplegable filtrado por el Departamento seleccionado) */}
            <Field label="2. Distrito (MH)">
              <select
                value={config.direccion_distrito || ''}
                onChange={e => manejarCambioDistrito(e.target.value)}
                disabled={!config.direccion_departamento}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">-- Seleccione Distrito --</option>
                {distritosDisponibles.map(dist => (
                  <option key={dist.codigo} value={dist.codigo}>
                    {dist.nombre}
                  </option>
                ))}
              </select>
            </Field>

            {/* 3. MUNICIPIO (Auto-Asignado Automáticamente según el Distrito escogido) */}
            <div className="col-span-2 bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                  3. Municipio Asignado Automáticamente (CAT-013 MH):
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {nombreMunicipioAuto ? nombreMunicipioAuto : 'Seleccione un Departamento y Distrito arriba'}
                </span>
              </div>
              <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            </div>

            <div className="col-span-2">
              <Field label="Dirección Complemento"><Input value={config.direccion_complemento || ''} onChange={e => setConfig({...config, direccion_complemento: e.target.value})} placeholder="Calle, avenida, número de local o casa..." /></Field>
            </div>
            
            <Field label="Teléfono"><Input value={config.telefono || ''} onChange={e => setConfig({...config, telefono: e.target.value})} /></Field>
            <Field label="Correo Electrónico Emisor"><Input type="email" value={config.email || ''} onChange={e => manejarAutoDetectarSMTP(e.target.value)} placeholder="facturacion@miempresa.com" /></Field>
            <Field label="Tipo Establecimiento"><Input value={config.establecimiento_tipo || '02'} onChange={e => setConfig({...config, establecimiento_tipo: e.target.value})} placeholder="02" /></Field>
            <Field label="Código Establecimiento"><Input value={config.establecimiento_cod || '0000'} onChange={e => setConfig({...config, establecimiento_cod: e.target.value})} placeholder="0000" /></Field>
          </div>
        </div>

        {/* Configuración de Correo Saliente (SMTP) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" /> Configuración de Correo Saliente (Envío Asíncrono DTE)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Asistente inteligente: Al ingresar tu correo, el sistema auto-detecta el servidor SMTP y te orienta paso a paso.
          </p>

          {instruccionesSmtp && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>{instruccionesSmtp}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Servidor SMTP (Host)"><Input value={config.smtp_host || ''} onChange={e => setConfig({...config, smtp_host: e.target.value})} placeholder="smtp.gmail.com" /></Field>
            <Field label="Puerto SMTP"><Input type="number" value={config.smtp_port || 587} onChange={e => setConfig({...config, smtp_port: e.target.value})} placeholder="587" /></Field>
            <Field label="Usuario SMTP (Correo)"><Input type="email" value={config.smtp_username || ''} onChange={e => manejarAutoDetectarSMTP(e.target.value)} placeholder="facturacion@miempresa.com" /></Field>
            <Field label="Contraseña SMTP / Clave de App">
              <Input type="password" value={config.smtp_password || ''} onChange={e => setConfig({...config, smtp_password: e.target.value})} placeholder="••••••••••••••••" />
            </Field>
          </div>

          {smtpMensaje && (
            <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${smtpMensaje.exito ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {smtpMensaje.exito ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{smtpMensaje.texto}</span>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={probarConexionSMTP}
              disabled={probandoSmtp || !config.smtp_host || !config.smtp_username}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              🧪 {probandoSmtp ? 'Probando Conexión...' : 'Probar Conexión SMTP'}
            </button>
          </div>
        </div>

        {/* API y Certificado */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-500" /> API Ministerio de Hacienda
            </h2>
            <div className="space-y-4">
              <Field label="Ambiente de Transmisión">
                <select value={config.ambiente || '00'} onChange={e => setConfig({...config, ambiente: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm">
                  <option value="00">Pruebas (00)</option>
                  <option value="01">Producción (01)</option>
                </select>
              </Field>
              <Field label="Contraseña API MH">
                <Input type="password" value={config.api_pwd || ''} onChange={e => setConfig({...config, api_pwd: e.target.value})} placeholder="Dejar en blanco para no cambiar" />
              </Field>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileBadge className="w-5 h-5 text-indigo-500" /> Certificado Firma (.p12)
            </h2>
            <div className="space-y-4">
              <Field label="Subir Archivo .p12">
                <input type="file" accept=".p12" onChange={manejarArchivo} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </Field>
              {config.certificado_p12_base64 && <div className="text-xs text-emerald-600 font-medium">✓ Certificado cargado en sistema</div>}
              
              <Field label="Contraseña del Certificado">
                <Input type="password" value={config.certificado_pwd || ''} onChange={e => setConfig({...config, certificado_pwd: e.target.value})} placeholder="Dejar en blanco para no cambiar" />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
