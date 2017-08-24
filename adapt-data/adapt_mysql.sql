-- phpMyAdmin SQL Dump
-- version 3.5.8.1
-- http://www.phpmyadmin.net
--
-- Host: vavit.no.mysql:3306
-- Generation Time: Sep 17, 2016 at 07:36 PM
-- Server version: 5.5.47-MariaDB-1~wheezy
-- PHP Version: 5.3.3-7+squeeze15

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `adapt`
--
CREATE DATABASE `adapt` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `adapt`;

-- --------------------------------------------------------

--
-- Table structure for table `ActivityIndexes`
--

CREATE TABLE IF NOT EXISTS `ActivityIndexes` (
  `activityIndexID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `timeUpdated` datetime NOT NULL,
  `dateFrom` date NOT NULL,
  `dateTo` date NOT NULL,
  `value` mediumint(9) NOT NULL,
  PRIMARY KEY (`activityIndexID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `Admin`
--

CREATE TABLE IF NOT EXISTS `Admin` (
  `userID` int(1) NOT NULL,
  `adminPassword` varchar(34) NOT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `Admin`
--

INSERT INTO `Admin` (`userID`, `adminPassword`) VALUES
(0, '$1$52c34cde$yK.wJncd/WMtngDRVZkvd0');

-- --------------------------------------------------------

--
-- Table structure for table `BalanceIndexes`
--

CREATE TABLE IF NOT EXISTS `BalanceIndexes` (
  `balanceIndexID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `timeUpdated` datetime NOT NULL,
  `dateFrom` date NOT NULL,
  `dateTo` date NOT NULL,
  `value` double(4,3) NOT NULL,
  PRIMARY KEY (`balanceIndexID`),
  KEY `userID` (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `ExerciseGroups`
--

CREATE TABLE IF NOT EXISTS `ExerciseGroups` (
  `exerciseGroupID` int(11) NOT NULL AUTO_INCREMENT,
  `exerciseGroupName` varchar(500) NOT NULL,
  `exerciseType` tinyint(1) NOT NULL,
  PRIMARY KEY (`exerciseGroupID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=8 ;

--
-- Dumping data for table `ExerciseGroups`
--

INSERT INTO `ExerciseGroups` (`exerciseGroupID`, `exerciseGroupName`, `exerciseType`) VALUES
(1, 'Reise/sette seg', 1),
(2, 'Stå på tå', 0),
(3, 'Stå på ett ben', 0),
(4, 'Telemarksnedslag', 1),
(5, 'Plukke epler', 1),
(6, 'Balanser på en linje', 0),
(7, 'Strekk og rotasjon (overkropp)', 1);

-- --------------------------------------------------------

--
-- Table structure for table `Exercises`
--

CREATE TABLE IF NOT EXISTS `Exercises` (
  `exerciseID` int(11) NOT NULL AUTO_INCREMENT,
  `indexSection` tinyint(1) NOT NULL,
  `title` varchar(50) NOT NULL,
  `imgFilename` varchar(50) DEFAULT NULL,
  `textPreList` varchar(500) DEFAULT NULL,
  `textList` varchar(1000) DEFAULT NULL,
  `textPostList` varchar(200) DEFAULT NULL,
  `textPostListBold` varchar(200) DEFAULT NULL,
  `exerciseGroupID` int(11) NOT NULL,
  PRIMARY KEY (`exerciseID`),
  KEY `exerciseGroupID` (`exerciseGroupID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=22 ;

--
-- Dumping data for table `Exercises`
--

INSERT INTO `Exercises` (`exerciseID`, `indexSection`, `title`, `imgFilename`, `textPreList`, `textList`, `textPostList`, `textPostListBold`, `exerciseGroupID`) VALUES
(1, -1, 'Reise/sette seg (dårlig balanse)', '1.png', 'Sitt oppreist ytterst på stolen (gjerne med armer i kryss over brystet).', 'Bøy overkroppen fram og reis deg raskt og kontrollert opp.;Sett deg kontrollert og langsomt ned igjen.', NULL, 'Gjenta øvelsen 10 ganger', 1),
(2, 0, 'Reise/sette seg (middels balanse)', '1.png', 'Sitt oppreist ytterst på stolen (gjerne med armer i kryss over brystet).', 'Bøy overkroppen fram og reis deg raskt og kontrollert opp.;Sett deg kontrollert og langsomt ned igjen.', NULL, 'Gjenta øvelsen 10 ganger', 1),
(3, 1, 'Reise/sette seg (god balanse)', '1.png', 'Sitt oppreist ytterst på stolen (gjerne med armer i kryss over brystet).', 'Bøy overkroppen fram og reis deg raskt og kontrollert opp.;Sett deg kontrollert og langsomt ned igjen.', NULL, 'Gjenta øvelsen 10 ganger', 1),
(4, -1, 'Stå på tå (dårlig balanse)', '2.png', 'Stå oppreist med hoftebreddes avstand mellom føttene. Støtt deg til en stol eller kjøkkenbenken ved behov.', 'Løft deg raskt og kontrollert opp på tå;Hold 1-2 sekund;Senk hælene langsomt og kontrollert ned', NULL, 'Gjenta øvelsen 10 ganger', 2),
(5, 0, 'Stå på tå (middels balanse)', '2.png', 'Stå oppreist med hoftebreddes avstand mellom føttene. Støtt deg til en stol eller kjøkkenbenken ved behov.', 'Løft deg raskt og kontrollert opp på tå;Hold 1-2 sekund;Senk hælene langsomt og kontrollert ned', NULL, 'Gjenta øvelsen 10 ganger', 2),
(6, 1, 'Stå på tå (god balanse)', '2.png', 'Stå oppreist med hoftebreddes avstand mellom føttene. Støtt deg til en stol eller kjøkkenbenken ved behov.', 'Løft deg raskt og kontrollert opp på tå;Hold 1-2 sekund;Senk hælene langsomt og kontrollert ned', NULL, 'Gjenta øvelsen 10 ganger', 2),
(7, -1, 'Stå på ett ben (dårlig balanse)', '3.png', 'Stå oppreist. Støtt deg så lite som mulig, eventuelt med fingertuppstøtte til en stol eller kjøkkenbenken.', 'Stå på ett ben.', 'Hold posisjonen i 10 sekunder.', 'Gjenta på motsatt ben', 3),
(8, 0, 'Stå på ett ben (middels balanse)', '3.png', 'Stå oppreist. Støtt deg så lite som mulig, eventuelt med fingertuppstøtte til en stol eller kjøkkenbenken.', 'Stå på ett ben.', 'Hold posisjonen i 10 sekunder.', 'Gjenta på motsatt ben', 3),
(9, 1, 'Stå på ett ben (god balanse)', '3.png', 'Stå oppreist. Støtt deg så lite som mulig, eventuelt med fingertuppstøtte til en stol eller kjøkkenbenken.', 'Stå på ett ben.', 'Hold posisjonen i 10 sekunder.', 'Gjenta på motsatt ben', 3),
(10, -1, 'Telemarksnedslag (dårlig balanse)', '4.png', 'Stå med samlede ben. Støtt deg til en stol eller kjøkkenbenken ved behov.', 'Ta et langt steg framover og skyv kroppsvekten over på det forreste benet.;Skyv i fra og flytt benet tilbake til utgangspunktet.', NULL, 'Gjenta 10 ganger på hvert ben', 4),
(11, 0, 'Telemarksnedslag (middels balanse)', '4.png', 'Stå med samlede ben. Støtt deg til en stol eller kjøkkenbenken ved behov.', 'Ta et langt steg framover og skyv kroppsvekten over på det forreste benet.;Skyv i fra og flytt benet tilbake til utgangspunktet.', NULL, 'Gjenta 10 ganger på hvert ben', 4),
(12, 1, 'Telemarksnedslag (god balanse)', '4.png', 'Stå med samlede ben. Støtt deg til en stol eller kjøkkenbenken ved behov.', 'Ta et langt steg framover og skyv kroppsvekten over på det forreste benet.;Skyv i fra og flytt benet tilbake til utgangspunktet.', NULL, 'Gjenta 10 ganger på hvert ben', 4),
(13, -1, 'Plukke epler (dårlig balanse)', '5.png', 'Stå foran kjøkkenbenken eller ved en stol. Lat som du står ved et epletre. Stå litt bredbeint og bruk minst mulig støtte.', 'Strekk deg rolig, og plukk et eple så langt opp til den ene siden som du kan, uten å flytte på føttene.;Bøy deg rolig ned mot en tenkt bøtte du har på den andre siden, og legg eplet i bøtta. Gjenta på den andre siden.', NULL, 'Skift retning. Gjenta 8-12 ganger', 5),
(14, 0, 'Plukke epler (middels balanse)', '5.png', 'Stå foran kjøkkenbenken eller ved en stol. Lat som du står ved et epletre. Stå litt bredbeint og bruk minst mulig støtte.', 'Strekk deg rolig, og plukk et eple så langt opp til den ene siden som du kan, uten å flytte på føttene.;Bøy deg rolig ned mot en tenkt bøtte du har på den andre siden, og legg eplet i bøtta. Gjenta på den andre siden.', NULL, 'Skift retning. Gjenta 8-12 ganger', 5),
(15, 1, 'Plukke epler (god balanse)', '5.png', 'Stå foran kjøkkenbenken eller ved en stol. Lat som du står ved et epletre. Stå litt bredbeint og bruk minst mulig støtte.', 'Strekk deg rolig, og plukk et eple så langt opp til den ene siden som du kan, uten å flytte på føttene.;Bøy deg rolig ned mot en tenkt bøtte du har på den andre siden, og legg eplet i bøtta. Gjenta på den andre siden.', NULL, 'Skift retning. Gjenta 8-12 ganger', 5),
(16, -1, 'Balanser på en linje (dårlig balanse)', '6.png', 'Stå oppreist med siden mot en stol eller kjøkkenbenken.', 'Sett ett ben rett foran det andre og gå så 10 steg framover på en rett linje.;Se framover og prøv å gå stødig', NULL, 'Skift retning', 6),
(17, 0, 'Balanser på en linje (middels balanse)', '6.png', 'Stå oppreist med siden mot en stol eller kjøkkenbenken.', 'Sett ett ben rett foran det andre og gå så 10 steg framover på en rett linje.;Se framover og prøv å gå stødig', NULL, 'Skift retning', 6),
(18, 1, 'Balanser på en linje (god balanse)', '6.png', 'Stå oppreist med siden mot en stol eller kjøkkenbenken.', 'Sett ett ben rett foran det andre og gå så 10 steg framover på en rett linje.;Se framover og prøv å gå stødig', NULL, 'Skift retning', 6),
(19, -1, 'Strekk og rotasjon (overkropp) (dårlig balanse)', '7.png', 'Sitt oppreist fram på stolen. Ha hoftebreddes avstand mellom føttene og med knær over ankler.', 'Plasser høyre hånd på motsatt kne og vri overkroppen mot venstre til du kjenner det strekker i siden.;Hold mens du teller til 10, returner til utgangsstilling.', NULL, 'Gjenta 2 ganger til hver side', 7),
(20, 0, 'Strekk og rotasjon (overkropp) (middels balanse)', '7.png', 'Sitt oppreist fram på stolen. Ha hoftebreddes avstand mellom føttene og med knær over ankler.', 'Plasser høyre hånd på motsatt kne og vri overkroppen mot venstre til du kjenner det strekker i siden.;Hold mens du teller til 10, returner til utgangsstilling.', NULL, 'Gjenta 2 ganger til hver side', 7),
(21, 1, 'Strekk og rotasjon (overkropp) (god balanse)', '7.png', 'Sitt oppreist fram på stolen. Ha hoftebreddes avstand mellom føttene og med knær over ankler.', 'Plasser høyre hånd på motsatt kne og vri overkroppen mot venstre til du kjenner det strekker i siden.;Hold mens du teller til 10, returner til utgangsstilling.', NULL, 'Gjenta 2 ganger til hver side', 7);

-- --------------------------------------------------------

--
-- Table structure for table `ExpertSeniorLink`
--

CREATE TABLE IF NOT EXISTS `ExpertSeniorLink` (
  `expertUserID` int(11) NOT NULL DEFAULT '0',
  `seniorUserID` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`expertUserID`,`seniorUserID`),
  KEY `seniorUserID` (`seniorUserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `ExpertUsers`
--

CREATE TABLE IF NOT EXISTS `ExpertUsers` (
  `userID` int(11) NOT NULL,
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `FeedbackMsgCustom`
--

CREATE TABLE IF NOT EXISTS `FeedbackMsgCustom` (
  `msgID` int(11) NOT NULL AUTO_INCREMENT,
  `userID` int(11) NOT NULL,
  `feedbackText` varbinary(1000) NOT NULL,
  `timeCreated` datetime NOT NULL,
  `category` int(1) NOT NULL,
  `AIFeedbackType` tinyint(1) DEFAULT NULL,
  `balanceExerciseID` int(11) DEFAULT NULL,
  `strengthExerciseID` int(11) DEFAULT NULL,
  `internalComment` varbinary(1000) DEFAULT NULL,
  PRIMARY KEY (`msgID`),
  KEY `userID` (`userID`),
  KEY `exerciseID` (`balanceExerciseID`),
  KEY `strengthExerciseID` (`strengthExerciseID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `FeedbackMsgCustomLog`
--

CREATE TABLE IF NOT EXISTS `FeedbackMsgCustomLog` (
  `msgID` int(11) NOT NULL,
  `timeStart` datetime NOT NULL,
  `timeEnd` datetime DEFAULT NULL,
  PRIMARY KEY (`msgID`,`timeStart`),
  KEY `msgID` (`msgID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `FeedbackMsgDefault`
--

CREATE TABLE IF NOT EXISTS `FeedbackMsgDefault` (
  `msgID` int(11) NOT NULL AUTO_INCREMENT,
  `feedbackText` varchar(1000) NOT NULL,
  `timeCreated` datetime NOT NULL,
  `category` tinyint(1) NOT NULL,
  `AIFeedbackType` tinyint(1) DEFAULT NULL,
  `idx` tinyint(1) NOT NULL,
  `balanceExerciseID` int(11) DEFAULT NULL,
  `strengthExerciseID` int(11) DEFAULT NULL,
  PRIMARY KEY (`msgID`),
  KEY `exerciseID` (`balanceExerciseID`),
  KEY `strengthExerciseID` (`strengthExerciseID`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Dumping data for table `FeedbackMsgDefault`
--

INSERT INTO `FeedbackMsgDefault` (`msgID`, `feedbackText`, `timeCreated`, `category`, `AIFeedbackType`, `idx`, `balanceExerciseID`, `strengthExerciseID`) VALUES
(1, 'Standardråd for lav BI', '2016-06-01 00:00:00', 1, NULL, -1, 7, 10),
(2, 'Standardråd for middels BI', '2016-06-01 00:00:00', 1, NULL, 0, 8, 11),
(3, 'Standardråd for høy BI', '2016-06-01 00:00:00', 1, NULL, 1, 9, 12),
(4, 'Standard aktivitetstips om å sitte mindre (AI=0)', '2016-06-01 00:00:00', 0, 0, 0, NULL, NULL),
(5, 'Standard aktivitetstips om å sitte mindre (AI=1)', '2016-06-01 00:00:00', 0, 0, 1, NULL, NULL),
(6, 'Standard aktivitetstips om å sitte mindre (AI=2)', '2016-06-01 00:00:00', 0, 0, 2, NULL, NULL),
(7, 'Standard aktivitetstips om å sitte mindre (AI=3)', '2016-06-01 00:00:00', 0, 0, 3, NULL, NULL),
(8, 'Standard aktivitetstips om å sitte mindre (AI=4)', '2016-06-01 00:00:00', 0, 0, 4, NULL, NULL),
(9, 'Standard aktivitetstips om å sitte mindre (AI=5)', '2016-06-01 00:00:00', 0, 0, 5, NULL, NULL),
(10, 'Standard aktivitetstips om å gå mer (AI=0)', '2016-06-01 00:00:00', 0, 1, 0, NULL, NULL),
(11, 'Standard aktivitetstips om å gå mer (AI=1)', '2016-06-01 00:00:00', 0, 1, 1, NULL, NULL),
(12, 'Standard aktivitetstips om å gå mer (AI=2)', '2016-06-01 00:00:00', 0, 1, 2, NULL, NULL),
(13, 'Standard aktivitetstips om å gå mer (AI=3)', '2016-06-01 00:00:00', 0, 1, 3, NULL, NULL),
(14, 'Standard aktivitetstips om å gå mer (AI=4)', '2016-06-01 00:00:00', 0, 1, 4, NULL, NULL),
(15, 'Standard aktivitetstips om å gå mer (AI=5)', '2016-06-01 00:00:00', 0, 1, 5, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `SeniorUsers`
--

CREATE TABLE IF NOT EXISTS `SeniorUsers` (
  `userID` int(11) NOT NULL,
  `address` varbinary(100) DEFAULT NULL,
  `zipCode` varbinary(44) DEFAULT NULL,
  `city` varbinary(44) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phoneNumber` varbinary(44) DEFAULT NULL,
  `isMale` bit(1) NOT NULL,
  `weight` smallint(5) unsigned DEFAULT NULL,
  `height` smallint(5) unsigned DEFAULT NULL,
  `usesWalkingAid` bit(1) DEFAULT NULL,
  `numFalls3Mths` tinyint(3) unsigned DEFAULT NULL,
  `numFalls12Mths` tinyint(3) unsigned DEFAULT NULL,
  `livingIndependently` bit(1) DEFAULT NULL,
  `dateJoinedAdapt` date DEFAULT NULL,
  `birthDate` varbinary(44) NOT NULL,
  `active` bit(1) NOT NULL DEFAULT b'1',
  `showPersonalizedBIFeedback` bit(1) NOT NULL DEFAULT b'0',
  `showPersonalizedAISittingFeedback` bit(1) NOT NULL DEFAULT b'0',
  `showPersonalizedAIWalkingFeedback` bit(1) NOT NULL DEFAULT b'0',
  `comment` varbinary(1000) DEFAULT NULL,
  `hasAccessedSystem` bit(1) NOT NULL DEFAULT b'0',
  `AIChartLineValue` double(4,3) NOT NULL DEFAULT '3.000',
  PRIMARY KEY (`userID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `Settings`
--

CREATE TABLE IF NOT EXISTS `Settings` (
  `BIThresholdLower` double(4,3) NOT NULL,
  `BIThresholdUpper` double(4,3) NOT NULL,
  `maxXAxisIntervalDays` int(11) NOT NULL,
  `BIImgHeader` varchar(50) NOT NULL,
  `BIChartHeader` varchar(50) NOT NULL,
  `AIChartHeader` varchar(50) NOT NULL,
  `BIImgLabelLow` varchar(50) NOT NULL,
  `BIImgLabelHigh` varchar(50) NOT NULL,
  `BIChartSpectrumLabelLow` varchar(50) NOT NULL,
  `BIChartSpectrumLabelMedium` varchar(50) NOT NULL,
  `BIChartSpectrumLabelHigh` varchar(50) NOT NULL,
  `BIChartLineText` varchar(50) NOT NULL,
  `AIChartLineText` varchar(50) NOT NULL,
  `BIImgHelpTooltipText` varchar(1000) NOT NULL,
  `BIChartHelpTooltipText` varchar(1000) NOT NULL,
  `AIChartHelpTooltipText` varchar(1000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `Settings`
--

INSERT INTO `Settings` (`BIThresholdLower`, `BIThresholdUpper`, `maxXAxisIntervalDays`, `BIImgHeader`, `BIChartHeader`, `AIChartHeader`, `BIImgLabelLow`, `BIImgLabelHigh`, `BIChartSpectrumLabelLow`, `BIChartSpectrumLabelMedium`, `BIChartSpectrumLabelHigh`, `BIChartLineText`, `AIChartLineText`, `BIImgHelpTooltipText`, `BIChartHelpTooltipText`, `AIChartHelpTooltipText`) VALUES
(-0.500, 0.500, 60, 'Din balanse', 'Din balanse over tid', 'Din aktivitet over tid', 'Høy fallrisiko', 'Lav fallrisiko', 'Lav', 'Medium', 'Høy', 'Normalverdi', 'Normalverdi', 'Dette er en representasjon av din balansesindeks. Dette er en verdi som påvirkes av <i>hvordan</i> du beveger deg. En høy balanseindeks vil bety lavere risiko for å falle. Grønt betyr høy balanseindeks, rød betyr lav.', 'Dette diagrammet viser hvordan balansen din har utviklet seg over tid.', 'Dette diagrammet viser hvor fysisk aktiv du har vært hver uke.');

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE IF NOT EXISTS `Users` (
  `userID` int(11) NOT NULL AUTO_INCREMENT,
  `username` varbinary(44) NOT NULL,
  `password` varchar(34) NOT NULL,
  `firstName` varbinary(44) NOT NULL,
  `lastName` varbinary(44) NOT NULL,
  PRIMARY KEY (`userID`),
  UNIQUE KEY `email` (`username`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ActivityIndexes`
--
ALTER TABLE `ActivityIndexes`
  ADD CONSTRAINT `ActivityIndexes_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `SeniorUsers` (`userID`);

--
-- Constraints for table `BalanceIndexes`
--
ALTER TABLE `BalanceIndexes`
  ADD CONSTRAINT `BalanceIndexes_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `SeniorUsers` (`userID`);

--
-- Constraints for table `Exercises`
--
ALTER TABLE `Exercises`
  ADD CONSTRAINT `Exercises_ibfk_1` FOREIGN KEY (`exerciseGroupID`) REFERENCES `ExerciseGroups` (`exerciseGroupID`);

--
-- Constraints for table `ExpertSeniorLink`
--
ALTER TABLE `ExpertSeniorLink`
  ADD CONSTRAINT `ExpertSeniorLink_ibfk_1` FOREIGN KEY (`expertUserID`) REFERENCES `ExpertUsers` (`userID`),
  ADD CONSTRAINT `ExpertSeniorLink_ibfk_2` FOREIGN KEY (`seniorUserID`) REFERENCES `SeniorUsers` (`userID`);

--
-- Constraints for table `ExpertUsers`
--
ALTER TABLE `ExpertUsers`
  ADD CONSTRAINT `ExpertUsers_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `Users` (`userID`);

--
-- Constraints for table `FeedbackMsgCustom`
--
ALTER TABLE `FeedbackMsgCustom`
  ADD CONSTRAINT `FeedbackMsgCustom_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `SeniorUsers` (`userID`),
  ADD CONSTRAINT `FeedbackMsgCustom_ibfk_2` FOREIGN KEY (`balanceExerciseID`) REFERENCES `Exercises` (`exerciseID`),
  ADD CONSTRAINT `FeedbackMsgCustom_ibfk_3` FOREIGN KEY (`strengthExerciseID`) REFERENCES `Exercises` (`exerciseID`);

--
-- Constraints for table `FeedbackMsgDefault`
--
ALTER TABLE `FeedbackMsgDefault`
  ADD CONSTRAINT `FeedbackMsgDefault_ibfk_1` FOREIGN KEY (`balanceExerciseID`) REFERENCES `Exercises` (`exerciseID`),
  ADD CONSTRAINT `FeedbackMsgDefault_ibfk_2` FOREIGN KEY (`strengthExerciseID`) REFERENCES `Exercises` (`exerciseID`);

--
-- Constraints for table `SeniorUsers`
--
ALTER TABLE `SeniorUsers`
  ADD CONSTRAINT `SeniorUsers_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `Users` (`userID`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
