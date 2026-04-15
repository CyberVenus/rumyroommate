CREATE DATABASE  IF NOT EXISTS `rumyroommate` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `rumyroommate`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: rumyroommate
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `createdroommatelistings`
--

DROP TABLE IF EXISTS `createdroommatelistings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `createdroommatelistings` (
  `postid` int unsigned NOT NULL AUTO_INCREMENT,
  `userid` int unsigned NOT NULL,
  `preferenceids` int NOT NULL,
  `createtime` date NOT NULL,
  `address` varchar(255) NOT NULL,
  `campus` varchar(255) DEFAULT NULL,
  `roomnumber` varchar(255) DEFAULT NULL,
  `roomtype` varchar(255) DEFAULT NULL,
  `numrooms` int unsigned DEFAULT NULL,
  `numroommates` int unsigned DEFAULT NULL,
  PRIMARY KEY (`postid`),
  KEY `fk_userid_posts` (`userid`),
  CONSTRAINT `fk_userid_posts` FOREIGN KEY (`userid`) REFERENCES `useraccounts` (`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `matchnotifications`
--

DROP TABLE IF EXISTS `matchnotifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matchnotifications` (
  `notificationid` int unsigned NOT NULL,
  `userid` int unsigned NOT NULL,
  `postid` int unsigned NOT NULL,
  PRIMARY KEY (`notificationid`),
  UNIQUE KEY `notificationid_UNIQUE` (`notificationid`),
  KEY `fk_userid_notif_idx` (`userid`),
  KEY `fk_postid_notif_idx` (`postid`),
  CONSTRAINT `fk_postid_notif` FOREIGN KEY (`postid`) REFERENCES `createdroommatelistings` (`postid`),
  CONSTRAINT `fk_userid_notif` FOREIGN KEY (`userid`) REFERENCES `useraccounts` (`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `savedroommatelistings`
--

DROP TABLE IF EXISTS `savedroommatelistings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `savedroommatelistings` (
  `saveid` int unsigned NOT NULL,
  `userid` int unsigned NOT NULL,
  `postid` int unsigned NOT NULL,
  PRIMARY KEY (`saveid`),
  UNIQUE KEY `relationid_UNIQUE` (`saveid`),
  KEY `fk_userid_saved_idx` (`userid`),
  KEY `fk_postid_saved_idx` (`postid`),
  CONSTRAINT `fk_postid_saved` FOREIGN KEY (`postid`) REFERENCES `createdroommatelistings` (`postid`),
  CONSTRAINT `fk_userid_saved` FOREIGN KEY (`userid`) REFERENCES `useraccounts` (`userid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `useraccounts`
--

DROP TABLE IF EXISTS `useraccounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useraccounts` (
  `userid` int unsigned NOT NULL AUTO_INCREMENT,
  `netid` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `realname` varchar(255) DEFAULT NULL,
  `age` int unsigned DEFAULT NULL,
  `gender` varchar(50) DEFAULT NULL,
  `ethnicity` varchar(100) DEFAULT NULL,
  `religion` varchar(100) DEFAULT NULL,
  `major` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`userid`),
  UNIQUE KEY `userid_UNIQUE` (`userid`),
  UNIQUE KEY `netid_UNIQUE` (`netid`),
  CONSTRAINT `chk_age` CHECK ((`age` >= 18))
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci KEY_BLOCK_SIZE=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userhabits`
--

DROP TABLE IF EXISTS `userhabits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userhabits` (
  `userid` int unsigned NOT NULL,
  `cleanliness` int unsigned DEFAULT NULL,
  `noisetolerance` int unsigned DEFAULT NULL,
  `sleephabits` varchar(255) DEFAULT NULL,
  `sleepstarttime` time DEFAULT NULL,
  `sleependtime` time DEFAULT NULL,
  `studystarttime` time DEFAULT NULL,
  `studyendtime` time DEFAULT NULL,
  `sharedstarttime` time DEFAULT NULL,
  `sharedendtime` time DEFAULT NULL,
  `smoking` char(1) DEFAULT NULL,
  `drinking` char(1) DEFAULT NULL,
  PRIMARY KEY (`userid`),
  CONSTRAINT `fk_userhabits_userid` FOREIGN KEY (`userid`) REFERENCES `useraccounts` (`userid`),
  CONSTRAINT `chk_habits_cleanliness` CHECK ((`cleanliness` between 1 and 10)),
  CONSTRAINT `chk_habits_drinking` CHECK (((`drinking` in (_utf8mb4'Y',_utf8mb4'N')) or (`drinking` is null))),
  CONSTRAINT `chk_habits_noisetolerance` CHECK ((`noisetolerance` between 1 and 10)),
  CONSTRAINT `chk_habits_smoking` CHECK (((`smoking` in (_utf8mb4'Y',_utf8mb4'N')) or (`smoking` is null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `userpreferences`
--

DROP TABLE IF EXISTS `userpreferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userpreferences` (
  `userid` int unsigned NOT NULL,
  `prefrace` varchar(255) DEFAULT NULL,
  `prefreligion` varchar(255) DEFAULT NULL,
  `prefsmoking` varchar(255) DEFAULT NULL,
  `prefdrinking` varchar(255) DEFAULT NULL,
  `roombudget` int unsigned DEFAULT NULL,
  `preflowtemp` int DEFAULT NULL,
  `prefhightemp` int DEFAULT NULL,
  `prefguestfreq` int unsigned DEFAULT NULL,
  `prefgender` varchar(50) DEFAULT NULL,
  `prefmajor` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`userid`),
  UNIQUE KEY `userid_UNIQUE` (`userid`),
  CONSTRAINT `fk_userid_pref` FOREIGN KEY (`userid`) REFERENCES `useraccounts` (`userid`),
  CONSTRAINT `chk_prefdrinking` CHECK ((`prefdrinking` in (_utf8mb4'Y',_utf8mb4'N',_utf8mb4'D'))),
  CONSTRAINT `chk_prefsmoking` CHECK ((`prefsmoking` in (_utf8mb4'Y',_utf8mb4'N',_utf8mb4'D')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-14 20:56:53
