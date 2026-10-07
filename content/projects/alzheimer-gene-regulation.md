---
title: Gene Regulation in Alzheimer's Disease Models
summary: Single-nucleus multiome of Alzheimer's disease mouse brains, asking which transcription factors drive disease changes in each cell type.
order: 1
tags: [single-nucleus multiome, snATAC-seq, transcription factor networks, Seurat, Signac]
pipeline: [snRNA + snATAC, QC, WNN integration, Annotation, Peaks & motifs, TF footprinting, Regulatory networks]
metrics:
  - value: "3"
    label: omics layers integrated (RNA, ATAC, ChIP)
  - value: "APP/PS1"
    label: Alzheimer's disease mouse model
links:
  paper: https://doi.org/10.3390/cells14241970
---

My Ph.D. work at the University of Pittsburgh. I analyze single-nucleus multiome data (RNA + ATAC) from
mouse models of Alzheimer's disease to find the transcription factors and regulatory networks behind
disease-related changes in each brain cell type. In a recent paper from the lab, we combined scRNA-seq,
snATAC-seq and RXR ChIP-seq to show how the RXR agonist bexarotene remodels chromatin and gene networks
in APP/PS1 mice.
