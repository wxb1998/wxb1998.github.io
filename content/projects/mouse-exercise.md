---
title: Exercise and the Mouse Multi-Tissue Transcriptome
summary: Single-cell, single-nucleus and bulk RNA-seq of mouse tissues in an exercise study.
order: 2
tags: [R, Python, Seurat, Scanpy, BBKNN, DESeq2]
pipeline: [Mapping, QC, Doublets, Integration, Annotation, DEGs, Regulons, Cell–cell comm.]
metrics:
  - value: "3"
    label: sequencing modalities
  - value: "2"
    label: parallel stacks (R + Python)
links:
  code: https://github.com/wxb1998/Mouse-exercise-Project
---

A multi-tissue view of how exercise reshapes gene expression in mice. Parallel workflows in Seurat (R)
and Scanpy (Python) cover read mapping, quality control, doublet detection, batch integration and
cell-type annotation, followed by differential expression, regulon inference and ligand–receptor
analysis. Bulk RNA-seq is processed from trimming through alignment, counting and DESeq2.
