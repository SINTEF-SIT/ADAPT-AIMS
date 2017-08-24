SELECT TABLE_NAME, TABLE_COLLATION
     FROM   TABLES
     WHERE  TABLE_SCHEMA = 'adapt';
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'ActivityIndexes'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`ActivityIndexes`
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'Admin'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`Admin`
MODIFY `adminPassword` VARBINARY(34) NOT NULL;
ALTER TABLE `adapt`.`Admin`
MODIFY `adminPassword` varchar(34) COLLATE utf8_general_ci NOT NULL ,
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'BalanceIndexes'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`BalanceIndexes`
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'ExerciseGroups'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`ExerciseGroups`
MODIFY `exerciseGroupName` VARBINARY(500) NOT NULL;
ALTER TABLE `adapt`.`ExerciseGroups`
MODIFY `exerciseGroupName` varchar(500) COLLATE utf8_general_ci NOT NULL ,
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'Exercises'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`Exercises`
MODIFY `title` VARBINARY(50) NOT NULL,
MODIFY `imgFilename` VARBINARY(50) ,
MODIFY `textPreList` VARBINARY(500) ,
MODIFY `textList` VARBINARY(1000) ,
MODIFY `textPostList` VARBINARY(200) ,
MODIFY `textPostListBold` VARBINARY(200) ;
ALTER TABLE `adapt`.`Exercises`
MODIFY `title` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `imgFilename` varchar(50) COLLATE utf8_general_ci  ,
MODIFY `textPreList` varchar(500) COLLATE utf8_general_ci  ,
MODIFY `textList` varchar(1000) COLLATE utf8_general_ci  ,
MODIFY `textPostList` varchar(200) COLLATE utf8_general_ci  ,
MODIFY `textPostListBold` varchar(200) COLLATE utf8_general_ci  ,
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'ExpertSeniorLink'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`ExpertSeniorLink`
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'ExpertUsers'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`ExpertUsers`
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'FeedbackMsgCustom'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`FeedbackMsgCustom`
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'FeedbackMsgCustomLog'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`FeedbackMsgCustomLog`
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'FeedbackMsgDefault'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`FeedbackMsgDefault`
MODIFY `feedbackText` VARBINARY(1000) NOT NULL;
ALTER TABLE `adapt`.`FeedbackMsgDefault`
MODIFY `feedbackText` varchar(1000) COLLATE utf8_general_ci NOT NULL ,
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'SeniorUsers'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`SeniorUsers`
MODIFY `email` VARBINARY(100) ;
ALTER TABLE `adapt`.`SeniorUsers`
MODIFY `email` varchar(100) COLLATE utf8_general_ci  ,
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'Settings'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`Settings`
MODIFY `BIImgHeader` VARBINARY(50) NOT NULL,
MODIFY `BIChartHeader` VARBINARY(50) NOT NULL,
MODIFY `AIChartHeader` VARBINARY(50) NOT NULL,
MODIFY `BIImgLabelLow` VARBINARY(50) NOT NULL,
MODIFY `BIImgLabelHigh` VARBINARY(50) NOT NULL,
MODIFY `BIChartSpectrumLabelLow` VARBINARY(50) NOT NULL,
MODIFY `BIChartSpectrumLabelMedium` VARBINARY(50) NOT NULL,
MODIFY `BIChartSpectrumLabelHigh` VARBINARY(50) NOT NULL,
MODIFY `BIChartLineText` VARBINARY(50) NOT NULL,
MODIFY `AIChartLineText` VARBINARY(50) NOT NULL,
MODIFY `BIImgHelpTooltipText` VARBINARY(1000) NOT NULL,
MODIFY `BIChartHelpTooltipText` VARBINARY(1000) NOT NULL,
MODIFY `AIChartHelpTooltipText` VARBINARY(1000) NOT NULL;
ALTER TABLE `adapt`.`Settings`
MODIFY `BIImgHeader` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `BIChartHeader` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `AIChartHeader` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `BIImgLabelLow` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `BIImgLabelHigh` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `BIChartSpectrumLabelLow` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `BIChartSpectrumLabelMedium` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `BIChartSpectrumLabelHigh` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `BIChartLineText` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `AIChartLineText` varchar(50) COLLATE utf8_general_ci NOT NULL ,
MODIFY `BIImgHelpTooltipText` varchar(1000) COLLATE utf8_general_ci NOT NULL ,
MODIFY `BIChartHelpTooltipText` varchar(1000) COLLATE utf8_general_ci NOT NULL ,
MODIFY `AIChartHelpTooltipText` varchar(1000) COLLATE utf8_general_ci NOT NULL ,
DEFAULT COLLATE utf8_general_ci;
SELECT *
         FROM   COLUMNS
         WHERE  TABLE_SCHEMA    = 'adapt'
            AND TABLE_Name      = 'Users'
            AND COLLATION_NAME IN('latin1_bin','latin1_general_ci','latin1_swedish_ci')
            AND COLLATION_NAME IS NOT NULL;
ALTER TABLE `adapt`.`Users`
MODIFY `password` VARBINARY(34) NOT NULL;
ALTER TABLE `adapt`.`Users`
MODIFY `password` varchar(34) COLLATE utf8_general_ci NOT NULL ,
DEFAULT COLLATE utf8_general_ci;
ALTER DATABASE adapt COLLATE utf8_general_ci;
